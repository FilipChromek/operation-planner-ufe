import { Component, Event, EventEmitter, Host, Prop, State, h } from '@stencil/core';
import { OperatingRoomsApi, OperatingRoom, Configuration } from '../../api/or-planner';

@Component({
  tag: 'orp-room-editor',
  styleUrl: 'orp-room-editor.css',
  shadow: true,
})
export class OrpRoomEditor {
  @Prop() entryId: string;
  @Prop() apiBase: string;
  @Event({ eventName: "editor-closed" }) editorClosed: EventEmitter<string>;

  @State() room: OperatingRoom;
  @State() errorMessage: string;
  @State() isValid: boolean;
  @State() equipmentText: string = "";
  private formElement: HTMLFormElement;

  async componentWillLoad() {
    if (!this.entryId || this.entryId === "@new") {
      this.room = {
        id: "",
        number: "",
        name: "",
        type: "general",
        capacity: 4,
        equipment: [],
        status: "active" as any,
        scheduledOperations: [],
        predefinedProcedures: [],
      };
      this.equipmentText = "";
      this.isValid = false;
      return;
    }
    try {
      const cfg = new Configuration({ basePath: this.apiBase });
      const api = new OperatingRoomsApi(cfg);
      const resp = await api.getRoomRaw({ roomId: this.entryId });
      if (resp.raw.status < 299) {
        this.room = await resp.value();
        this.equipmentText = (this.room.equipment || []).join(", ");
        this.isValid = true;
      } else {
        this.errorMessage = `Sála sa nenašla: ${resp.raw.statusText}`;
      }
    } catch (err: any) {
      this.errorMessage = `Chyba: ${err.message || "unknown"}`;
    }
  }

  private handleInput(ev: InputEvent): string {
    const target = ev.target as HTMLInputElement;
    this.validateForm('silent');
    return target.value;
  }

  private validateForm(mode: 'silent' | 'show-errors'): boolean {
    this.isValid = true;
    if (!this.formElement) return false;
    for (let i = 0; i < this.formElement.children.length; i++) {
      const el = this.formElement.children[i] as HTMLElement & {
        checkValidity?: () => boolean;
        reportValidity?: () => boolean;
      };
      let valid = true;
      if (mode === 'show-errors' && el.reportValidity) valid = el.reportValidity();
      else if (el.checkValidity) valid = el.checkValidity();
      this.isValid &&= valid;
    }
    return this.isValid;
  }

  private async save() {
    if (!this.validateForm('show-errors')) return;
    this.room.equipment = this.equipmentText.split(",").map(s => s.trim()).filter(s => s);
    try {
      const cfg = new Configuration({ basePath: this.apiBase });
      const api = new OperatingRoomsApi(cfg);
      const isNew = !this.entryId || this.entryId === "@new";
      if (isNew && !this.room.id) {
        this.room.id = `or-${Date.now()}`;
      }
      const resp = isNew
        ? await api.createRoomRaw({ operatingRoom: this.room })
        : await api.updateRoomRaw({ roomId: this.entryId, operatingRoom: this.room });
      if (resp.raw.status < 299) {
        this.editorClosed.emit("store");
      } else {
        this.errorMessage = `Chyba uloženia: ${resp.raw.statusText}`;
      }
    } catch (err: any) {
      this.errorMessage = `Chyba: ${err.message || "unknown"}`;
    }
  }

  render() {
    if (this.errorMessage) {
      return <Host><div class="error">{this.errorMessage}</div></Host>;
    }
    if (!this.room) return <Host><div class="loading">Načítavam…</div></Host>;

    return (
      <Host>
        <h2>{this.entryId === "@new" ? "Nová sála" : "Úprava sály"}</h2>
        <form ref={el => this.formElement = el}>
          <md-filled-text-field
            label="Číslo sály"
            required pattern=".*\S.*"
            value={this.room.number}
            oninput={(ev: InputEvent) => this.room.number = this.handleInput(ev)}>
            <md-icon slot="leading-icon">tag</md-icon>
          </md-filled-text-field>

          <md-filled-text-field
            label="Názov sály"
            required pattern=".*\S.*"
            value={this.room.name}
            oninput={(ev: InputEvent) => this.room.name = this.handleInput(ev)}>
            <md-icon slot="leading-icon">badge</md-icon>
          </md-filled-text-field>

          <md-filled-select
            label="Typ"
            value={this.room.type}
            oninput={(ev: InputEvent) => this.room.type = this.handleInput(ev)}>
            <md-icon slot="leading-icon">category</md-icon>
            <md-select-option value="general"><div slot="headline">Všeobecná</div></md-select-option>
            <md-select-option value="cardiac"><div slot="headline">Kardiochirurgická</div></md-select-option>
            <md-select-option value="orthopedic"><div slot="headline">Ortopedická</div></md-select-option>
            <md-select-option value="neuro"><div slot="headline">Neurochirurgická</div></md-select-option>
          </md-filled-select>

          <md-filled-select
            label="Stav"
            value={this.room.status}
            oninput={(ev: InputEvent) => (this.room.status = this.handleInput(ev) as any)}>
            <md-icon slot="leading-icon">power_settings_new</md-icon>
            <md-select-option value="active"><div slot="headline">V prevádzke</div></md-select-option>
            <md-select-option value="maintenance"><div slot="headline">Údržba</div></md-select-option>
            <md-select-option value="inactive"><div slot="headline">Mimo prevádzky</div></md-select-option>
          </md-filled-select>

          <md-filled-text-field
            label="Vybavenie (oddelené čiarkou)"
            value={this.equipmentText}
            oninput={(ev: InputEvent) => this.equipmentText = this.handleInput(ev)}>
            <md-icon slot="leading-icon">build</md-icon>
          </md-filled-text-field>
        </form>

        <div class="duration-slider">
          <span class="label">Kapacita:&nbsp;</span>
          <span class="label">{this.room.capacity}</span>
          <md-slider min="1" max="12" value={this.room.capacity} ticks labeled
            oninput={(ev: InputEvent) => {
              this.room.capacity = Number.parseInt(this.handleInput(ev));
              this.room = { ...this.room };
            }}>
          </md-slider>
        </div>

        <md-divider inset></md-divider>

        <div class="actions">
          <md-outlined-button id="cancel" onClick={() => this.editorClosed.emit("cancel")}>
            Zrušiť
          </md-outlined-button>
          <md-filled-button id="confirm" onClick={() => this.save()}>
            <md-icon slot="icon">save</md-icon>
            Uložiť
          </md-filled-button>
        </div>
      </Host>
    );
  }
}

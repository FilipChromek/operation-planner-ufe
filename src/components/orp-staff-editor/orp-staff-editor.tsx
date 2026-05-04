import { Component, Event, EventEmitter, Host, Prop, State, h } from '@stencil/core';
import { MedicalStaffApi, MedicalStaff, Configuration } from '../../api/or-planner';

@Component({
  tag: 'orp-staff-editor',
  styleUrl: 'orp-staff-editor.css',
  shadow: true,
})
export class OrpStaffEditor {
  @Prop() entryId: string;
  @Prop() apiBase: string;
  @Event({ eventName: "editor-closed" }) editorClosed: EventEmitter<string>;

  @State() member: MedicalStaff;
  @State() errorMessage: string;
  @State() isValid: boolean;
  private formElement: HTMLFormElement;

  async componentWillLoad() {
    if (!this.entryId || this.entryId === "@new") {
      this.member = {
        id: "",
        firstName: "",
        lastName: "",
        role: "doctor" as any,
        specialization: "",
        availability: [],
      };
      this.isValid = false;
      return;
    }
    try {
      const cfg = new Configuration({ basePath: this.apiBase });
      const api = new MedicalStaffApi(cfg);
      const resp = await api.getStaffMemberRaw({ staffId: this.entryId });
      if (resp.raw.status < 299) {
        this.member = await resp.value();
        this.isValid = true;
      } else {
        this.errorMessage = `Člen tímu sa nenašiel: ${resp.raw.statusText}`;
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

  private addAvailabilitySlot() {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const end = new Date(tomorrow.getTime() + 8 * 60 * 60 * 1000);
    this.member.availability = [
      ...(this.member.availability || []),
      { from: tomorrow, to: end }
    ];
    this.member = { ...this.member };
  }

  private removeSlot(idx: number) {
    this.member.availability.splice(idx, 1);
    this.member = { ...this.member };
  }

  private async save() {
    if (!this.validateForm('show-errors')) return;
    const isNew = !this.entryId || this.entryId === "@new";
    if (isNew && !this.member.id) {
      this.member.id = `staff-${Date.now()}`;
    }
    try {
      const cfg = new Configuration({ basePath: this.apiBase });
      const api = new MedicalStaffApi(cfg);
      const resp = isNew
        ? await api.createStaffRaw({ medicalStaff: this.member })
        : await api.updateStaffMemberRaw({ staffId: this.entryId, medicalStaff: this.member });
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
    if (this.errorMessage) return <Host><div class="error">{this.errorMessage}</div></Host>;
    if (!this.member) return <Host><div class="loading">Načítavam…</div></Host>;
    const isNew = this.entryId === "@new";

    return (
      <Host>
        <h2>{isNew ? "Nový člen tímu" : "Úprava člena tímu"}</h2>
        <form ref={el => this.formElement = el}>
          <md-filled-text-field label="Meno" required pattern=".*\S.*"
            value={this.member.firstName}
            oninput={(ev: InputEvent) => this.member.firstName = this.handleInput(ev)}>
            <md-icon slot="leading-icon">person</md-icon>
          </md-filled-text-field>

          <md-filled-text-field label="Priezvisko" required pattern=".*\S.*"
            value={this.member.lastName}
            oninput={(ev: InputEvent) => this.member.lastName = this.handleInput(ev)}>
            <md-icon slot="leading-icon">badge</md-icon>
          </md-filled-text-field>

          <md-filled-select label="Rola" required
            value={this.member.role}
            oninput={(ev: InputEvent) => (this.member.role = this.handleInput(ev) as any)}>
            <md-icon slot="leading-icon">work</md-icon>
            <md-select-option value="doctor"><div slot="headline">Lekár</div></md-select-option>
            <md-select-option value="nurse"><div slot="headline">Sestra</div></md-select-option>
          </md-filled-select>

          <md-filled-text-field label="Špecializácia"
            value={this.member.specialization || ""}
            oninput={(ev: InputEvent) => this.member.specialization = this.handleInput(ev)}>
            <md-icon slot="leading-icon">school</md-icon>
          </md-filled-text-field>
        </form>

        <div class="availability">
          <div class="section-header">
            <span class="label">Dostupnosť (pracovné zmeny):</span>
            <md-outlined-button onClick={() => this.addAvailabilitySlot()}>
              <md-icon slot="icon">add</md-icon>
              Pridať smenu
            </md-outlined-button>
          </div>
          {(this.member.availability || []).map((slot, idx) =>
            <div class="slot">
              <span>{new Date(slot.from).toLocaleString()} → {new Date(slot.to).toLocaleString()}</span>
              <md-outlined-button onClick={() => this.removeSlot(idx)}>
                <md-icon slot="icon">delete</md-icon>
              </md-outlined-button>
            </div>
          )}
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

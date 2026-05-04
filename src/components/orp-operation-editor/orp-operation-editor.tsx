import { Component, Event, EventEmitter, Host, Prop, State, h } from '@stencil/core';
import {
  ScheduledOperationsApi, OperatingRoomsApi, PatientsApi, MedicalStaffApi,
  ScheduledOperation, OperatingRoom, Patient, MedicalStaff, Configuration
} from '../../api/or-planner';

@Component({
  tag: 'orp-operation-editor',
  styleUrl: 'orp-operation-editor.css',
  shadow: true,
})
export class OrpOperationEditor {
  @Prop() entryId: string;
  @Prop() roomId: string;
  @Prop() apiBase: string;
  @Event({ eventName: "editor-closed" }) editorClosed: EventEmitter<string>;

  @State() op: ScheduledOperation;
  @State() room: OperatingRoom;
  @State() patients: Patient[] = [];
  @State() staff: MedicalStaff[] = [];
  @State() errorMessage: string;
  @State() isValid: boolean;
  @State() scheduledStartLocal: string = "";
  private formElement: HTMLFormElement;

  private cfg(): Configuration {
    return new Configuration({ basePath: this.apiBase });
  }

  async componentWillLoad() {
    try {
      const cfg = this.cfg();
      // Load room (for predefined procedures)
      const roomResp = await new OperatingRoomsApi(cfg).getRoomRaw({ roomId: this.roomId });
      if (roomResp.raw.status < 299) this.room = await roomResp.value();
      // Load patients
      const pResp = await new PatientsApi(cfg).getPatientsRaw();
      if (pResp.raw.status < 299) this.patients = (await pResp.value()).filter(p => !p.archived);
      // Load staff
      const sResp = await new MedicalStaffApi(cfg).getStaffRaw();
      if (sResp.raw.status < 299) this.staff = (await sResp.value()).filter(s => !s.archived);

      if (!this.entryId || this.entryId === "@new") {
        const future = new Date(Date.now() + 60 * 60 * 1000); // +1h
        this.op = {
          id: "",
          patientId: "",
          staffIds: [],
          procedureType: "",
          priority: 3,
          scheduledStart: future,
          durationMinutes: 60,
          status: 'planned' as any,
          notes: ""
        };
        this.scheduledStartLocal = this.toDatetimeLocalString(future);
        this.isValid = false;
      } else {
        const opApi = new ScheduledOperationsApi(cfg);
        const resp = await opApi.getOperationRaw({ roomId: this.roomId, opId: this.entryId });
        if (resp.raw.status < 299) {
          this.op = await resp.value();
          this.scheduledStartLocal = this.toDatetimeLocalString(new Date(this.op.scheduledStart));
          this.isValid = true;
        } else {
          this.errorMessage = `Operácia sa nenašla: ${resp.raw.statusText}`;
        }
      }
    } catch (err: any) {
      this.errorMessage = `Chyba: ${err.message || "unknown"}`;
    }
  }

  private toDatetimeLocalString(d: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
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

  private toggleStaff(staffId: string) {
    const ids = this.op.staffIds || [];
    const idx = ids.indexOf(staffId);
    if (idx >= 0) ids.splice(idx, 1);
    else ids.push(staffId);
    this.op = { ...this.op, staffIds: [...ids] };
  }

  private async save() {
    if (!this.validateForm('show-errors')) return;
    this.op.scheduledStart = new Date(this.scheduledStartLocal);

    const isNew = !this.entryId || this.entryId === "@new";
    if (isNew && !this.op.id) {
      this.op.id = `op-${Date.now()}`;
    }
    try {
      const api = new ScheduledOperationsApi(this.cfg());
      const resp = isNew
        ? await api.createOperationRaw({ roomId: this.roomId, scheduledOperation: this.op })
        : await api.updateOperationRaw({ roomId: this.roomId, opId: this.entryId, scheduledOperation: this.op });
      if (resp.raw.status < 299) {
        this.editorClosed.emit("store");
      } else {
        this.errorMessage = `Chyba uloženia: ${resp.raw.statusText}`;
      }
    } catch (err: any) {
      this.errorMessage = `Chyba: ${err.message || "unknown"}`;
    }
  }

  private async deleteOp() {
    if (!this.entryId || this.entryId === "@new") return;
    try {
      const api = new ScheduledOperationsApi(this.cfg());
      const resp = await api.deleteOperationRaw({ roomId: this.roomId, opId: this.entryId });
      if (resp.raw.status < 299) {
        this.editorClosed.emit("delete");
      } else {
        this.errorMessage = `Chyba mazania: ${resp.raw.statusText}`;
      }
    } catch (err: any) {
      this.errorMessage = `Chyba: ${err.message || "unknown"}`;
    }
  }

  render() {
    if (this.errorMessage) return <Host><div class="error">{this.errorMessage}</div></Host>;
    if (!this.op) return <Host><div class="loading">Načítavam…</div></Host>;

    const procedures = this.room?.predefinedProcedures || [];
    const isNew = this.entryId === "@new";

    return (
      <Host>
        <h2>{isNew ? "Nová operácia" : "Úprava operácie"}</h2>

        <form ref={el => this.formElement = el}>
          <md-filled-select label="Pacient" required
            value={this.op.patientId}
            oninput={(ev: InputEvent) => this.op.patientId = this.handleInput(ev)}>
            <md-icon slot="leading-icon">person</md-icon>
            {this.patients.map(p =>
              <md-select-option value={p.id}>
                <div slot="headline">{p.firstName} {p.lastName} ({p.birthNumber})</div>
              </md-select-option>
            )}
          </md-filled-select>

          <md-filled-select label="Typ zákroku" required
            value={this.op.procedureType}
            oninput={(ev: InputEvent) => {
              this.op.procedureType = this.handleInput(ev);
              const proc = procedures.find(p => p.code === this.op.procedureType);
              if (proc?.typicalDurationMinutes) {
                this.op.durationMinutes = proc.typicalDurationMinutes;
                this.op = { ...this.op };
              }
            }}>
            <md-icon slot="leading-icon">medical_information</md-icon>
            {procedures.map(p =>
              <md-select-option value={p.code}>
                <div slot="headline">{p.name} ({p.typicalDurationMinutes} min)</div>
              </md-select-option>
            )}
          </md-filled-select>

          <md-filled-text-field
            label="Plánovaný začiatok"
            type="datetime-local"
            required
            value={this.scheduledStartLocal}
            oninput={(ev: InputEvent) => this.scheduledStartLocal = this.handleInput(ev)}>
            <md-icon slot="leading-icon">schedule</md-icon>
          </md-filled-text-field>
        </form>

        <div class="duration-slider">
          <span class="label">Priorita:&nbsp;</span>
          <span class="label">{this.op.priority}</span>
          <md-slider min="1" max="5" value={this.op.priority} ticks labeled
            oninput={(ev: InputEvent) => {
              this.op.priority = Number.parseInt(this.handleInput(ev));
              this.op = { ...this.op };
            }}>
          </md-slider>
        </div>

        <div class="duration-slider">
          <span class="label">Trvanie:&nbsp;{this.op.durationMinutes} min</span>
          <md-slider min="15" max="480" step="15" value={this.op.durationMinutes} ticks labeled
            oninput={(ev: InputEvent) => {
              this.op.durationMinutes = Number.parseInt(this.handleInput(ev));
              this.op = { ...this.op };
            }}>
          </md-slider>
        </div>

        <div class="staff-section">
          <span class="label">Pridelený tím:</span>
          <md-chip-set>
            {this.staff.map(s =>
              <md-filter-chip
                label={`${s.firstName} ${s.lastName} (${s.role})`}
                selected={this.op.staffIds?.includes(s.id)}
                onClick={() => this.toggleStaff(s.id)}>
              </md-filter-chip>
            )}
          </md-chip-set>
        </div>

        <md-filled-text-field
          label="Poznámka"
          value={this.op.notes || ""}
          oninput={(ev: InputEvent) => this.op.notes = this.handleInput(ev)}>
          <md-icon slot="leading-icon">notes</md-icon>
        </md-filled-text-field>

        <md-divider inset></md-divider>

        <div class="actions">
          <md-filled-tonal-button id="delete" disabled={isNew}
            onClick={() => this.deleteOp()}>
            <md-icon slot="icon">delete</md-icon>
            Zrušiť operáciu
          </md-filled-tonal-button>
          <span class="stretch-fill"></span>
          <md-outlined-button id="cancel" onClick={() => this.editorClosed.emit("cancel")}>
            Zatvoriť
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

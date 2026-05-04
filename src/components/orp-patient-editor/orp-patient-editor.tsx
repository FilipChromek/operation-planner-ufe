import { Component, Event, EventEmitter, Host, Prop, State, h } from '@stencil/core';
import { PatientsApi, Patient, Configuration } from '../../api/or-planner';

@Component({
  tag: 'orp-patient-editor',
  styleUrl: 'orp-patient-editor.css',
  shadow: true,
})
export class OrpPatientEditor {
  @Prop() entryId: string;
  @Prop() apiBase: string;
  @Event({ eventName: "editor-closed" }) editorClosed: EventEmitter<string>;

  @State() patient: Patient;
  @State() errorMessage: string;
  @State() isValid: boolean;
  private formElement: HTMLFormElement;

  async componentWillLoad() {
    if (!this.entryId || this.entryId === "@new") {
      this.patient = {
        id: "",
        firstName: "",
        lastName: "",
        birthNumber: "",
        contact: "",
        insurance: "VšZP",
      };
      this.isValid = false;
      return;
    }
    try {
      const cfg = new Configuration({ basePath: this.apiBase });
      const api = new PatientsApi(cfg);
      const resp = await api.getPatientRaw({ patientId: this.entryId });
      if (resp.raw.status < 299) {
        this.patient = await resp.value();
        this.isValid = true;
      } else {
        this.errorMessage = `Pacient sa nenašiel: ${resp.raw.statusText}`;
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
    const isNew = !this.entryId || this.entryId === "@new";
    if (isNew && !this.patient.id) {
      this.patient.id = `p-${Date.now()}`;
    }
    try {
      const cfg = new Configuration({ basePath: this.apiBase });
      const api = new PatientsApi(cfg);
      const resp = isNew
        ? await api.createPatientRaw({ patient: this.patient })
        : await api.updatePatientRaw({ patientId: this.entryId, patient: this.patient });
      if (resp.raw.status < 299) {
        this.editorClosed.emit("store");
      } else {
        this.errorMessage = `Chyba uloženia: ${resp.raw.statusText}`;
      }
    } catch (err: any) {
      this.errorMessage = `Chyba: ${err.message || "unknown"}`;
    }
  }

  private async archive() {
    this.patient.archived = true;
    await this.save();
    this.editorClosed.emit("archive");
  }

  render() {
    if (this.errorMessage) return <Host><div class="error">{this.errorMessage}</div></Host>;
    if (!this.patient) return <Host><div class="loading">Načítavam…</div></Host>;
    const isNew = this.entryId === "@new";

    return (
      <Host>
        <h2>{isNew ? "Nový pacient" : "Úprava pacienta"}</h2>
        <form ref={el => this.formElement = el}>
          <md-filled-text-field label="Meno" required pattern=".*\S.*"
            value={this.patient.firstName}
            oninput={(ev: InputEvent) => this.patient.firstName = this.handleInput(ev)}>
            <md-icon slot="leading-icon">person</md-icon>
          </md-filled-text-field>

          <md-filled-text-field label="Priezvisko" required pattern=".*\S.*"
            value={this.patient.lastName}
            oninput={(ev: InputEvent) => this.patient.lastName = this.handleInput(ev)}>
            <md-icon slot="leading-icon">badge</md-icon>
          </md-filled-text-field>

          <md-filled-text-field label="Rodné číslo" required pattern="^\d{6}/?\d{3,4}$"
            value={this.patient.birthNumber}
            oninput={(ev: InputEvent) => this.patient.birthNumber = this.handleInput(ev)}>
            <md-icon slot="leading-icon">fingerprint</md-icon>
          </md-filled-text-field>

          <md-filled-text-field label="Kontakt"
            value={this.patient.contact || ""}
            oninput={(ev: InputEvent) => this.patient.contact = this.handleInput(ev)}>
            <md-icon slot="leading-icon">phone</md-icon>
          </md-filled-text-field>

          <md-filled-select label="Poisťovňa"
            value={this.patient.insurance || "VšZP"}
            oninput={(ev: InputEvent) => this.patient.insurance = this.handleInput(ev)}>
            <md-icon slot="leading-icon">health_and_safety</md-icon>
            <md-select-option value="VšZP"><div slot="headline">VšZP</div></md-select-option>
            <md-select-option value="Dôvera"><div slot="headline">Dôvera</div></md-select-option>
            <md-select-option value="Union"><div slot="headline">Union</div></md-select-option>
          </md-filled-select>
        </form>

        <md-divider inset></md-divider>

        <div class="actions">
          <md-filled-tonal-button id="archive" disabled={isNew}
            onClick={() => this.archive()}>
            <md-icon slot="icon">archive</md-icon>
            Archivovať
          </md-filled-tonal-button>
          <span class="stretch-fill"></span>
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

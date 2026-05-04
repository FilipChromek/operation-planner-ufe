import { Component, Event, EventEmitter, Host, Prop, State, h } from '@stencil/core';
import { PatientsApi, Patient, Configuration } from '../../api/or-planner';

@Component({
  tag: 'orp-patients-list',
  styleUrl: 'orp-patients-list.css',
  shadow: true,
})
export class OrpPatientsList {
  @Event({ eventName: "entry-clicked" }) entryClicked: EventEmitter<string>;
  @Prop() apiBase: string;
  @State() errorMessage: string;
  @State() patients: Patient[] = [];

  async componentWillLoad() {
    try {
      const cfg = new Configuration({ basePath: this.apiBase });
      const api = new PatientsApi(cfg);
      const resp = await api.getPatientsRaw();
      if (resp.raw.status < 299) this.patients = await resp.value();
      else this.errorMessage = `Chyba: ${resp.raw.statusText}`;
    } catch (err: any) {
      this.errorMessage = `Chyba pripojenia: ${err.message || "unknown"}`;
    }
  }

  render() {
    return (
      <Host>
        <h2>Pacienti</h2>
        {this.errorMessage
          ? <div class="error">{this.errorMessage}</div>
          : <md-list>
            {this.patients.filter(p => !p.archived).map(p =>
              <md-list-item onClick={() => this.entryClicked.emit(p.id)}>
                <div slot="headline">{p.firstName} {p.lastName}</div>
                <div slot="supporting-text">
                  RČ: {p.birthNumber} · Poisťovňa: {p.insurance || '–'} · Kontakt: {p.contact || '–'}
                </div>
                <md-icon slot="start">person</md-icon>
              </md-list-item>
            )}
          </md-list>
        }
        <md-filled-icon-button class="add-button"
          onclick={() => this.entryClicked.emit("@new")}>
          <md-icon>add</md-icon>
        </md-filled-icon-button>
      </Host>
    );
  }
}

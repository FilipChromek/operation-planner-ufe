import { Component, Event, EventEmitter, Host, Prop, State, h } from '@stencil/core';
import { PatientsApi, Patient, Configuration } from '../../api/or-planner';

const INSURANCE_COLOR: Record<string, string> = {
  VšZP: '#1565c0',
  Dôvera: '#2e7d32',
  Union: '#6a1b9a',
};

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
    const filtered = this.patients.filter(p => !p.archived);

    return (
      <Host>
        <div class="page-header">
          <div class="page-title">
            <md-icon>person</md-icon>
            <h2>Pacienti</h2>
            <span class="count">{filtered.length}</span>
          </div>
          <md-filled-button onclick={() => this.entryClicked.emit("@new")}>
            <md-icon slot="icon">person_add</md-icon>
            Pridať pacienta
          </md-filled-button>
        </div>

        {this.errorMessage ? (
          <div class="error">{this.errorMessage}</div>
        ) : filtered.length === 0 ? (
          <div class="empty-state">
            <md-icon>person_search</md-icon>
            <p>Žiadni pacienti nie sú evidovaní.</p>
            <md-filled-button onclick={() => this.entryClicked.emit("@new")}>
              <md-icon slot="icon">person_add</md-icon>
              Pridať prvého pacienta
            </md-filled-button>
          </div>
        ) : (
          <div class="card-grid">
            {filtered.map(p => (
              <div class="card" onClick={() => this.entryClicked.emit(p.id)}>
                <div class="card-avatar">
                  <md-icon>person</md-icon>
                </div>
                <div class="card-body">
                  <div class="card-title">{p.firstName} {p.lastName}</div>
                  <div class="card-meta">
                    <span class="meta-item"><md-icon>badge</md-icon>RČ: {p.birthNumber || '–'}</span>
                    {p.contact && (
                      <span class="meta-item"><md-icon>call</md-icon>{p.contact}</span>
                    )}
                  </div>
                  {p.insurance && (
                    <span class="insurance-badge" style={{ background: INSURANCE_COLOR[p.insurance] || '#455a64' }}>
                      {p.insurance}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Host>
    );
  }
}

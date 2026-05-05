import { Component, Event, EventEmitter, Host, Prop, State, h } from '@stencil/core';
import { MedicalStaffApi, MedicalStaff, Configuration } from '../../api/or-planner';

@Component({
  tag: 'orp-staff-list',
  styleUrl: 'orp-staff-list.css',
  shadow: true,
})
export class OrpStaffList {
  @Event({ eventName: "entry-clicked" }) entryClicked: EventEmitter<string>;
  @Prop() apiBase: string;
  @State() errorMessage: string;
  @State() staff: MedicalStaff[] = [];

  async componentWillLoad() {
    try {
      const cfg = new Configuration({ basePath: this.apiBase });
      const api = new MedicalStaffApi(cfg);
      const resp = await api.getStaffRaw();
      if (resp.raw.status < 299) this.staff = await resp.value();
      else this.errorMessage = `Chyba: ${resp.raw.statusText}`;
    } catch (err: any) {
      this.errorMessage = `Chyba pripojenia: ${err.message || "unknown"}`;
    }
  }

  render() {
    const filtered = this.staff.filter(s => !s.archived);
    const doctors = filtered.filter(s => s.role === 'doctor');
    const nurses = filtered.filter(s => s.role !== 'doctor');

    const renderCard = (s: MedicalStaff) => (
      <div class={`card role-${s.role}`} onClick={() => this.entryClicked.emit(s.id)}>
        <div class="card-avatar">
          <md-icon>{s.role === 'doctor' ? 'medical_services' : 'health_and_safety'}</md-icon>
        </div>
        <div class="card-body">
          <div class="card-title">{s.firstName} {s.lastName}</div>
          <div class="card-meta">
            {s.specialization && (
              <span class="meta-item"><md-icon>school</md-icon>{s.specialization}</span>
            )}
          </div>
          <span class={`role-badge role-${s.role}`}>
            {s.role === 'doctor' ? 'Lekár' : 'Zdravotná sestra'}
          </span>
        </div>
      </div>
    );

    return (
      <Host>
        <div class="page-header">
          <div class="page-title">
            <md-icon>medical_services</md-icon>
            <h2>Zdravotnícky personál</h2>
            <span class="count">{filtered.length}</span>
          </div>
          <md-filled-button onclick={() => this.entryClicked.emit("@new")}>
            <md-icon slot="icon">person_add</md-icon>
            Pridať personál
          </md-filled-button>
        </div>

        {this.errorMessage ? (
          <div class="error">{this.errorMessage}</div>
        ) : filtered.length === 0 ? (
          <div class="empty-state">
            <md-icon>medical_services</md-icon>
            <p>Žiadny zdravotnícky personál nie je evidovaný.</p>
            <md-filled-button onclick={() => this.entryClicked.emit("@new")}>
              <md-icon slot="icon">person_add</md-icon>
              Pridať prvého člena
            </md-filled-button>
          </div>
        ) : (
          <div class="sections">
            {doctors.length > 0 && (
              <div class="section">
                <div class="section-label">
                  <md-icon>medical_services</md-icon>
                  Lekári <span class="count">{doctors.length}</span>
                </div>
                <div class="card-grid">{doctors.map(renderCard)}</div>
              </div>
            )}
            {nurses.length > 0 && (
              <div class="section">
                <div class="section-label">
                  <md-icon>health_and_safety</md-icon>
                  Zdravotné sestry <span class="count">{nurses.length}</span>
                </div>
                <div class="card-grid">{nurses.map(renderCard)}</div>
              </div>
            )}
          </div>
        )}
      </Host>
    );
  }
}

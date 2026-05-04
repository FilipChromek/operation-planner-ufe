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

  private roleIcon(role: string): string {
    return role === 'doctor' ? 'medical_services' : 'health_and_safety';
  }

  render() {
    return (
      <Host>
        <h2>Zdravotnícky personál</h2>
        {this.errorMessage
          ? <div class="error">{this.errorMessage}</div>
          : <md-list>
            {this.staff.filter(s => !s.archived).map(s =>
              <md-list-item onClick={() => this.entryClicked.emit(s.id)}>
                <div slot="headline">{s.firstName} {s.lastName}</div>
                <div slot="supporting-text">
                  Rola: {s.role === 'doctor' ? 'Lekár' : 'Sestra'} · Špecializácia: {s.specialization || '–'}
                </div>
                <md-icon slot="start">{this.roleIcon(s.role)}</md-icon>
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

import { Component, Event, EventEmitter, Host, Prop, State, h } from '@stencil/core';
import { OperatingRoomsApi, OperatingRoom, Configuration } from '../../api/or-planner';

const STATUS_LABEL: Record<string, string> = {
  active: 'V prevádzke',
  maintenance: 'Údržba',
  inactive: 'Mimo prevádzky',
};

const TYPE_LABEL: Record<string, string> = {
  general: 'Všeobecná',
  cardiac: 'Kardiochirurgická',
  orthopedic: 'Ortopedická',
  neuro: 'Neurochirurgická',
};

@Component({
  tag: 'orp-rooms-list',
  styleUrl: 'orp-rooms-list.css',
  shadow: true,
})
export class OrpRoomsList {
  @Event({ eventName: "entry-clicked" }) entryClicked: EventEmitter<string>;
  @Prop() apiBase: string;
  @State() errorMessage: string;
  @State() rooms: OperatingRoom[] = [];

  private async load(): Promise<OperatingRoom[]> {
    try {
      const cfg = new Configuration({ basePath: this.apiBase });
      const api = new OperatingRoomsApi(cfg);
      const resp = await api.getRoomsRaw();
      if (resp.raw.status < 299) return await resp.value();
      this.errorMessage = `Chyba načítania zoznamu sál: ${resp.raw.statusText}`;
    } catch (err: any) {
      this.errorMessage = `Chyba pripojenia: ${err.message || "unknown"}`;
    }
    return [];
  }

  async componentWillLoad() {
    this.rooms = await this.load();
  }

  render() {
    const filtered = this.rooms.filter(r => !r.archived);

    return (
      <Host>
        <div class="page-header">
          <div class="page-title">
            <md-icon>meeting_room</md-icon>
            <h2>Operačné sály</h2>
            <span class="count">{filtered.length}</span>
          </div>
          <md-filled-button onclick={() => this.entryClicked.emit("@new")}>
            <md-icon slot="icon">add</md-icon>
            Pridať sálu
          </md-filled-button>
        </div>

        {this.errorMessage ? (
          <div class="error">{this.errorMessage}</div>
        ) : filtered.length === 0 ? (
          <div class="empty-state">
            <md-icon>meeting_room</md-icon>
            <p>Žiadne sály nie sú evidované.</p>
            <md-filled-button onclick={() => this.entryClicked.emit("@new")}>
              <md-icon slot="icon">add</md-icon>
              Pridať prvú sálu
            </md-filled-button>
          </div>
        ) : (
          <div class="card-grid">
            {filtered.map(room => (
              <div class="card" onClick={() => this.entryClicked.emit(room.id)}>
                <div class={`card-accent status-${room.status}`}></div>
                <div class="card-body">
                  <div class="card-title">
                    <md-icon>meeting_room</md-icon>
                    <span>{room.name}</span>
                  </div>
                  <div class="card-meta">
                    <span class="meta-item"><md-icon>tag</md-icon>č. {room.number}</span>
                    <span class="meta-item"><md-icon>category</md-icon>{TYPE_LABEL[room.type] || room.type || '–'}</span>
                    <span class="meta-item"><md-icon>group</md-icon>Kapacita: {room.capacity ?? '–'}</span>
                    {room.equipment?.length > 0 && (
                      <span class="meta-item"><md-icon>build</md-icon>{room.equipment.join(', ')}</span>
                    )}
                  </div>
                  <span class={`status-badge status-${room.status}`}>
                    {STATUS_LABEL[room.status] || room.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Host>
    );
  }
}

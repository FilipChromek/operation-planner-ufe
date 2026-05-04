import { Component, Event, EventEmitter, Host, Prop, State, h } from '@stencil/core';
import { OperatingRoomsApi, OperatingRoom, Configuration } from '../../api/or-planner';

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

  private statusColor(status: string): string {
    switch (status) {
      case 'active': return '#4caf50';
      case 'maintenance': return '#ff9800';
      case 'inactive': return '#9e9e9e';
      default: return '#607d8b';
    }
  }

  render() {
    return (
      <Host>
        <h2>Operačné sály</h2>
        {this.errorMessage
          ? <div class="error">{this.errorMessage}</div>
          : <md-list>
            {this.rooms.filter(r => !r.archived).map(room =>
              <md-list-item onClick={() => this.entryClicked.emit(room.id)}>
                <div slot="headline">{room.name} (č. {room.number})</div>
                <div slot="supporting-text">
                  Typ: {room.type || '–'} · Kapacita: {room.capacity ?? '–'} · Stav:{' '}
                  <span style={{ color: this.statusColor(room.status) }}>{room.status}</span>
                </div>
                <md-icon slot="start">meeting_room</md-icon>
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

import { Component, Event, EventEmitter, Host, Prop, State, h } from '@stencil/core';
import { ScheduledOperationsApi, OperatingRoomsApi, ScheduledOperation, OperatingRoom, Configuration } from '../../api/or-planner';

@Component({
  tag: 'orp-operation-list',
  styleUrl: 'orp-operation-list.css',
  shadow: true,
})
export class OrpOperationList {
  @Event({ eventName: "entry-clicked" }) entryClicked: EventEmitter<string>;
  @Event({ eventName: "back-clicked" }) backClicked: EventEmitter<void>;
  @Event({ eventName: "edit-room-clicked" }) editRoomClicked: EventEmitter<void>;

  @Prop() apiBase: string;
  @Prop() roomId: string;

  @State() errorMessage: string;
  @State() operations: ScheduledOperation[] = [];
  @State() room: OperatingRoom;
  @State() isLoading = true;
  @State() removedMessage: string = '';

  async componentWillLoad() {
    const msg = sessionStorage.getItem('or-planner-removed');
    if (msg) {
      this.removedMessage = msg;
      sessionStorage.removeItem('or-planner-removed');
      setTimeout(() => { this.removedMessage = ''; }, 4000);
    }

    try {
      const cfg = new Configuration({ basePath: this.apiBase });
      const [opsResp, roomResp] = await Promise.all([
        new ScheduledOperationsApi(cfg).getRoomOperationsRaw({ roomId: this.roomId }),
        new OperatingRoomsApi(cfg).getRoomRaw({ roomId: this.roomId }),
      ]);
      if (opsResp.raw.status < 299) this.operations = await opsResp.value();
      else this.errorMessage = `Chyba operácií: ${opsResp.raw.statusText}`;
      if (roomResp.raw.status < 299) this.room = await roomResp.value();
    } catch (err: any) {
      this.errorMessage = `Chyba pripojenia: ${err.message || 'unknown'}`;
    } finally {
      this.isLoading = false;
    }
  }

  private priorityColor(p?: number): string {
    if (p === undefined) return '#9e9e9e';
    if (p >= 4) return '#c62828';
    if (p === 3) return '#ef6c00';
    return '#558b2f';
  }

  private priorityLabel(p?: number): string {
    if (p === undefined) return '–';
    if (p >= 4) return `Urgentná (${p})`;
    if (p === 3) return `Vysoká (${p})`;
    return `Štandardná (${p})`;
  }

  render() {
    const roomName = this.room
      ? `${this.room.name} (č. ${this.room.number})`
      : this.roomId;

    return (
      <Host>
        <header>
          <div class="header-left">
            <md-outlined-button onClick={() => this.backClicked.emit()}>
              <md-icon slot="icon">arrow_back</md-icon>Späť
            </md-outlined-button>
            <div class="room-title">
              <md-icon>meeting_room</md-icon>
              <h2>{roomName}</h2>
            </div>
          </div>
          <div class="header-actions">
            <md-outlined-button onclick={() => this.editRoomClicked.emit()}>
              <md-icon slot="icon">edit</md-icon>Upraviť sálu
            </md-outlined-button>
            <md-filled-button onclick={() => this.entryClicked.emit('@new')}>
              <md-icon slot="icon">add</md-icon>Pridať operáciu
            </md-filled-button>
          </div>
        </header>

        {this.removedMessage && (
          <div class="removed-banner">
            <md-icon>check_circle</md-icon>
            {this.removedMessage}
          </div>
        )}

        {this.isLoading ? (
          <div class="loading-state">
            <md-circular-progress indeterminate></md-circular-progress>
            <span>Načítavam operácie…</span>
          </div>
        ) : this.errorMessage ? (
          <div class="error">{this.errorMessage}</div>
        ) : this.operations.length === 0 ? (
          <div class="empty-state">
            <md-icon>calendar_month</md-icon>
            <p>Žiadne naplánované operácie.</p>
            <md-filled-button onclick={() => this.entryClicked.emit('@new')}>
              <md-icon slot="icon">add</md-icon>Naplánovať operáciu
            </md-filled-button>
          </div>
        ) : (
          <div class="card-grid">
            {this.operations.map(op => (
              <div class="card" onClick={() => this.entryClicked.emit(op.id)}>
                <div class="card-accent" style={{ background: this.priorityColor(op.priority) }}></div>
                <div class="card-body">
                  <div class="card-title">
                    <md-icon>surgical</md-icon>
                    <span>{op.procedureType || 'Neurčený výkon'}</span>
                  </div>
                  <div class="card-meta">
                    <span class="meta-item">
                      <md-icon>calendar_today</md-icon>
                      {new Date(op.scheduledStart).toLocaleString('sk-SK')}
                    </span>
                    <span class="meta-item">
                      <md-icon>schedule</md-icon>
                      {op.durationMinutes} min
                    </span>
                    <span class="meta-item">
                      <md-icon>person</md-icon>
                      {op.patientId}
                    </span>
                  </div>
                  <div class="card-badges">
                    <span class="priority-badge"
                      style={{ color: this.priorityColor(op.priority), borderColor: this.priorityColor(op.priority) }}>
                      {this.priorityLabel(op.priority)}
                    </span>
                    {op.status && <span class="status-badge">{op.status}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Host>
    );
  }
}

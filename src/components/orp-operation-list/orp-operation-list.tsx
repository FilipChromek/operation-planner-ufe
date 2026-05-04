import { Component, Event, EventEmitter, Host, Prop, State, h } from '@stencil/core';
import { ScheduledOperationsApi, ScheduledOperation, Configuration } from '../../api/or-planner';

@Component({
  tag: 'orp-operation-list',
  styleUrl: 'orp-operation-list.css',
  shadow: true,
})
export class OrpOperationList {
  @Event({ eventName: "entry-clicked" }) entryClicked: EventEmitter<string>;
  @Event({ eventName: "back-clicked" }) backClicked: EventEmitter<void>;

  @Prop() apiBase: string;
  @Prop() roomId: string;

  @State() errorMessage: string;
  @State() operations: ScheduledOperation[] = [];

  private async load(): Promise<ScheduledOperation[]> {
    try {
      const cfg = new Configuration({ basePath: this.apiBase });
      const api = new ScheduledOperationsApi(cfg);
      const resp = await api.getRoomOperationsRaw({ roomId: this.roomId });
      if (resp.raw.status < 299) return await resp.value();
      this.errorMessage = `Chyba: ${resp.raw.statusText}`;
    } catch (err: any) {
      this.errorMessage = `Chyba pripojenia: ${err.message || "unknown"}`;
    }
    return [];
  }

  async componentWillLoad() {
    this.operations = await this.load();
  }

  private priorityColor(priority?: number): string {
    if (priority === undefined) return '#9e9e9e';
    if (priority >= 4) return '#c62828';
    if (priority === 3) return '#ef6c00';
    return '#558b2f';
  }

  render() {
    return (
      <Host>
        <header>
          <md-outlined-button onClick={() => this.backClicked.emit()}>
            <md-icon slot="icon">arrow_back</md-icon> Späť
          </md-outlined-button>
          <h2>Rozvrh sály — {this.roomId}</h2>
        </header>

        {this.errorMessage
          ? <div class="error">{this.errorMessage}</div>
          : this.operations.length === 0
            ? <div class="empty">Žiadne naplánované operácie.</div>
            : <md-list>
              {this.operations.map(op =>
                <md-list-item onClick={() => this.entryClicked.emit(op.id)}>
                  <div slot="headline">
                    {op.procedureType} — pacient: {op.patientId}
                  </div>
                  <div slot="supporting-text">
                    Začiatok: {new Date(op.scheduledStart).toLocaleString()} ·{' '}
                    Trvanie: {op.durationMinutes} min ·{' '}
                    Priorita: <span style={{ color: this.priorityColor(op.priority) }}>{op.priority || '–'}</span> ·{' '}
                    Stav: {op.status || 'planned'}
                  </div>
                  <md-icon slot="start">surgical</md-icon>
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

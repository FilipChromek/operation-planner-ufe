import { Component, Host, Prop, State, h } from '@stencil/core';

declare global {
  interface Window { navigation: any; }
}

@Component({
  tag: 'orp-or-app',
  styleUrl: 'orp-or-app.css',
  shadow: true,
})
export class OrpOrApp {
  @State() private relativePath = "";
  @Prop() basePath: string = "";
  @Prop() apiBase: string;

  componentWillLoad() {
    const baseUri = new URL(this.basePath, document.baseURI || "/").pathname;

    const toRelative = (path: string) => {
      if (path.startsWith(baseUri)) {
        this.relativePath = path.slice(baseUri.length);
      } else {
        this.relativePath = "";
      }
    };

    window.navigation?.addEventListener("navigate", (ev: Event) => {
      if ((ev as any).canIntercept) { (ev as any).intercept(); }
      const path = new URL((ev as any).destination.url).pathname;
      toRelative(path);
    });

    toRelative(location.pathname);
  }

  private navigate(path: string) {
    const absolute = new URL(path, new URL(this.basePath, document.baseURI)).pathname;
    window.navigation.navigate(absolute);
  }

  render() {
    const segments = this.relativePath.split("/").filter(s => s);
    let content;

    if (segments[0] === "rooms" && segments[1] === "@new") {
      content = (
        <orp-room-editor
          entry-id="@new"
          api-base={this.apiBase}
          oneditor-closed={() => this.navigate("./rooms")}
        />
      );
    } else if (segments[0] === "rooms" && segments[1] && segments[2] === "edit") {
      content = (
        <orp-room-editor
          entry-id={segments[1]}
          api-base={this.apiBase}
          oneditor-closed={() => this.navigate("./rooms")}
        />
      );
    } else if (segments[0] === "rooms" && segments[1] && segments[2] === "operations" && segments[3]) {
      content = (
        <orp-operation-editor
          entry-id={segments[3]}
          room-id={segments[1]}
          api-base={this.apiBase}
          oneditor-closed={() => this.navigate(`./rooms/${segments[1]}`)}
        />
      );
    } else if (segments[0] === "rooms" && segments[1]) {
      content = (
        <orp-operation-list
          room-id={segments[1]}
          api-base={this.apiBase}
          onentry-clicked={(ev: CustomEvent<string>) =>
            this.navigate(`./rooms/${segments[1]}/operations/${ev.detail}`)
          }
          onback-clicked={() => this.navigate("./rooms")}
          onedit-room-clicked={() => this.navigate(`./rooms/${segments[1]}/edit`)}
        />
      );
    } else if (segments[0] === "patients" && segments[1]) {
      content = (
        <orp-patient-editor
          entry-id={segments[1]}
          api-base={this.apiBase}
          oneditor-closed={(ev: CustomEvent<string>) => {
            if (ev.detail === 'archive') sessionStorage.setItem('or-planner-removed', 'Pacient bol úspešne archivovaný.');
            this.navigate("./patients");
          }}
        />
      );
    } else if (segments[0] === "patients") {
      content = (
        <orp-patients-list
          api-base={this.apiBase}
          onentry-clicked={(ev: CustomEvent<string>) =>
            this.navigate(`./patients/${ev.detail}`)
          }
        />
      );
    } else if (segments[0] === "staff" && segments[1]) {
      content = (
        <orp-staff-editor
          entry-id={segments[1]}
          api-base={this.apiBase}
          oneditor-closed={() => this.navigate("./staff")}
        />
      );
    } else if (segments[0] === "staff") {
      content = (
        <orp-staff-list
          api-base={this.apiBase}
          onentry-clicked={(ev: CustomEvent<string>) =>
            this.navigate(`./staff/${ev.detail}`)
          }
        />
      );
    } else {
      // default: rooms list
      content = (
        <orp-rooms-list
          api-base={this.apiBase}
          onentry-clicked={(ev: CustomEvent<string>) => {
            if (ev.detail === "@new") this.navigate("./rooms/@new");
            else this.navigate(`./rooms/${ev.detail}`);
          }}
        />
      );
    }

    const activeSection = segments[0] || 'rooms';

    return (
      <Host>
        <nav class="top-nav">
          <div class="nav-brand">
            <md-icon>local_hospital</md-icon>
            <span>OR Plánovač</span>
          </div>
          <div class="nav-tabs">
            <button class={activeSection === 'rooms' ? 'active' : ''} onClick={() => this.navigate("./rooms")}>
              <md-icon>meeting_room</md-icon><span>Sály</span>
            </button>
            <button class={activeSection === 'patients' ? 'active' : ''} onClick={() => this.navigate("./patients")}>
              <md-icon>person</md-icon><span>Pacienti</span>
            </button>
            <button class={activeSection === 'staff' ? 'active' : ''} onClick={() => this.navigate("./staff")}>
              <md-icon>medical_services</md-icon><span>Personál</span>
            </button>
          </div>
        </nav>
        <main class="content">{content}</main>
      </Host>
    );
  }
}

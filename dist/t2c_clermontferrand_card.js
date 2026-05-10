class T2CClermontFerrandCard extends HTMLElement {
  static getStubConfig() {
    return {
      entity: "",
      title: "",
      passages: 5,
      show_perturbations: true,
    };
  }

  static getConfigElement() {
    return document.createElement("t2c-clermontferrand-card-editor");
  }

  setConfig(config) {
    this.config = {
      entity: "",
      title: "",
      passages: 5,
      show_perturbations: true,
      ...config,
    };

    this._baseEntity = this._getBaseEntity(this.config.entity);
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  getCardSize() {
    return 4;
  }

  _getBaseEntity(entityId) {
    return entityId.replace(/_passage_\d+$/, "");
  }

  _getPassageEntity(index) {
    return `${this._baseEntity}_passage_${index}`;
  }

  _getPerturbationEntity() {
    return `${this._baseEntity}_perturbations_ligne`;
  }

  _getLineLabel(entityId) {
    const match = entityId.match(/(?:^|_)ligne_([^_]+)/);
    return match ? match[1].toUpperCase() : "";
  }

  _formatUpdatedAt(value) {
    if (!value) return "";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  _getFriendlyStopName() {
    const selectedState = this._hass?.states?.[this.config.entity];
    const deviceName = selectedState?.attributes?.device_name;
    const friendlyName = selectedState?.attributes?.friendly_name;

    if (this.config.title) return this.config.title;
    if (deviceName) return deviceName;
    if (friendlyName) return friendlyName.replace(/\s*passage\s*1\s*$/i, "");

    return "T2C Clermont-Ferrand";
  }

  _render() {
    if (!this.config || !this._hass) return;

    const card = document.createElement("ha-card");
    const style = document.createElement("style");

    style.textContent = `
      .t2c-card {
        padding: 16px;
      }

      .t2c-title {
        margin: 0 0 16px;
        color: var(--primary-text-color);
        font-size: 20px;
        font-weight: 600;
        line-height: 1.25;
      }

      .t2c-table {
        width: 100%;
        border-collapse: collapse;
        color: var(--primary-text-color);
        text-align: center;
      }

      .t2c-table th {
        background: var(--t2c-line-color, #b00010);
        color: #fff;
        font-weight: 600;
        padding: 10px 8px;
      }

      .t2c-table th:first-child {
        border-top-left-radius: 8px;
      }

      .t2c-table th:last-child {
        border-top-right-radius: 8px;
      }

      .t2c-table td {
        border-bottom: 1px solid var(--divider-color);
        padding: 9px 8px;
        vertical-align: middle;
      }

      .t2c-table tbody tr:nth-child(even) {
        background: var(--secondary-background-color);
      }

      .t2c-line {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 32px;
        min-height: 28px;
        border-radius: 6px;
        background: var(--t2c-line-color, #b00010);
        color: #fff;
        font-weight: 700;
      }

      .t2c-destination,
      .t2c-info {
        overflow-wrap: anywhere;
      }

      .t2c-time {
        font-weight: 700;
        white-space: nowrap;
      }

      .t2c-empty {
        color: var(--secondary-text-color);
        font-style: italic;
      }

      .t2c-config {
        color: var(--secondary-text-color);
        line-height: 1.45;
      }

      .t2c-alert {
        margin-top: 16px;
        border-radius: 8px;
        border: 1px solid rgba(214, 152, 0, 0.32);
        background: var(--warning-color, #fff3cd);
        color: var(--primary-text-color);
        padding: 12px;
      }

      .t2c-alert-title {
        font-weight: 700;
        margin-bottom: 4px;
      }

      .t2c-alert-updated {
        color: var(--secondary-text-color);
        font-size: 12px;
        margin-top: 8px;
      }

      @media (max-width: 420px) {
        .t2c-card {
          padding: 12px;
        }

        .t2c-title {
          font-size: 18px;
        }

        .t2c-table th,
        .t2c-table td {
          padding: 8px 5px;
          font-size: 13px;
        }

        .t2c-info {
          display: none;
        }
      }
    `;

    const wrapper = document.createElement("div");
    wrapper.className = "t2c-card";
    wrapper.style.setProperty("--t2c-line-color", this.config.color || "#b00010");

    if (!this.config.entity) {
      wrapper.innerHTML = `
        <h2 class="t2c-title">T2C Clermont-Ferrand</h2>
        <div class="t2c-config">Selectionnez l'entite passage_1 de l'arret a afficher.</div>
      `;
      card.appendChild(style);
      card.appendChild(wrapper);
      this.replaceChildren(card);
      return;
    }

    const lineLabel = this.config.line || this._getLineLabel(this.config.entity);
    const passages = Math.max(1, Math.min(Number(this.config.passages) || 5, 10));

    const title = document.createElement("h2");
    title.className = "t2c-title";
    title.textContent = this._getFriendlyStopName();
    wrapper.appendChild(title);

    const table = document.createElement("table");
    table.className = "t2c-table";
    table.innerHTML = `
      <thead>
        <tr>
          <th>Ligne</th>
          <th>Destination</th>
          <th>Depart</th>
          <th class="t2c-info">Infos</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;

    const tbody = table.querySelector("tbody");

    for (let index = 1; index <= passages; index += 1) {
      const entityId = this._getPassageEntity(index);
      const state = this._hass.states[entityId];
      const row = document.createElement("tr");

      if (!state) {
        row.innerHTML = `
          <td><span class="t2c-line">${this._escape(lineLabel || "?")}</span></td>
          <td class="t2c-empty" colspan="3">Entite introuvable : ${this._escape(entityId)}</td>
        `;
      } else {
        row.innerHTML = `
          <td><span class="t2c-line">${this._escape(lineLabel || state.attributes.line || "?")}</span></td>
          <td class="t2c-destination">${this._escape(state.attributes.destination || "-")}</td>
          <td class="t2c-time">${this._escape(state.state || "-")}</td>
          <td class="t2c-info">${this._escape(state.attributes.info || "")}</td>
        `;
      }

      tbody.appendChild(row);
    }

    wrapper.appendChild(table);

    if (this.config.show_perturbations) {
      const perturbation = this._hass.states[this._getPerturbationEntity()];
      const titleText = perturbation?.attributes?.title;
      const bodyText = perturbation?.attributes?.text;

      if (perturbation && (titleText || bodyText)) {
        const alert = document.createElement("div");
        alert.className = "t2c-alert";

        const updatedAt = this._formatUpdatedAt(perturbation.attributes.updated_at);
        alert.innerHTML = `
          <div class="t2c-alert-title">Perturbation</div>
          <div>${this._escape(titleText || "")}${titleText && bodyText ? " : " : ""}${this._escape(bodyText || "")}</div>
          ${updatedAt ? `<div class="t2c-alert-updated">Mise a jour : ${this._escape(updatedAt)}</div>` : ""}
        `;
        wrapper.appendChild(alert);
      }
    }

    card.appendChild(style);
    card.appendChild(wrapper);
    this.replaceChildren(card);
  }

  _escape(value) {
    const div = document.createElement("div");
    div.textContent = String(value ?? "");
    return div.innerHTML;
  }
}

class T2CClermontFerrandCardEditor extends HTMLElement {
  setConfig(config) {
    this.config = {
      entity: "",
      title: "",
      passages: 5,
      show_perturbations: true,
      color: "#b00010",
      ...config,
    };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  _valueChanged(event) {
    if (!this.config || !this._hass) return;

    const target = event.target;
    const key = target.configValue;
    const value = target.checked !== undefined && target.type === "checkbox"
      ? target.checked
      : target.value;

    const config = {
      ...this.config,
      [key]: key === "passages" ? Number(value) : value,
    };

    this.config = config;
    this.dispatchEvent(new CustomEvent("config-changed", {
      detail: { config },
      bubbles: true,
      composed: true,
    }));
  }

  _render() {
    if (!this._hass || !this.config) return;

    const root = document.createElement("div");
    root.innerHTML = `
      <style>
        .editor {
          display: grid;
          gap: 16px;
        }

        .field {
          display: grid;
          gap: 6px;
        }

        label {
          color: var(--secondary-text-color);
          font-size: 12px;
          font-weight: 500;
        }

        input,
        select {
          box-sizing: border-box;
          width: 100%;
          border: 1px solid var(--divider-color);
          border-radius: 6px;
          background: var(--card-background-color);
          color: var(--primary-text-color);
          font: inherit;
          padding: 10px;
        }

        .checkbox {
          align-items: center;
          display: flex;
          gap: 10px;
        }

        .checkbox input {
          width: auto;
        }
      </style>
      <div class="editor">
        <div class="field">
          <label for="entity">Entite passage_1</label>
          <ha-entity-picker
            id="entity"
            allow-custom-entity
          ></ha-entity-picker>
        </div>
        <div class="field">
          <label for="title">Titre personnalise</label>
          <input id="title" type="text" value="${this._escapeAttr(this.config.title || "")}" placeholder="Nom de l'arret">
        </div>
        <div class="field">
          <label for="passages">Nombre de passages</label>
          <input id="passages" type="number" min="1" max="10" value="${Number(this.config.passages) || 5}">
        </div>
        <div class="field">
          <label for="color">Couleur de ligne</label>
          <input id="color" type="color" value="${this._escapeAttr(this.config.color || "#b00010")}">
        </div>
        <label class="checkbox">
          <input id="show_perturbations" type="checkbox" ${this.config.show_perturbations ? "checked" : ""}>
          Afficher les perturbations
        </label>
      </div>
    `;

    const entityPicker = root.querySelector("#entity");
    entityPicker.configValue = "entity";
    entityPicker.hass = this._hass;
    entityPicker.value = this.config.entity || "";
    entityPicker.addEventListener("value-changed", (event) => {
      this._valueChanged({
        target: {
          configValue: "entity",
          value: event.detail.value,
        },
      });
    });

    for (const input of root.querySelectorAll("input")) {
      input.configValue = input.id;
      input.addEventListener("change", this._valueChanged.bind(this));
      input.addEventListener("input", this._valueChanged.bind(this));
    }

    this.replaceChildren(root);
  }

  _escapeAttr(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
}

if (!customElements.get("t2c-clermontferrand-card")) {
  customElements.define("t2c-clermontferrand-card", T2CClermontFerrandCard);
}

if (!customElements.get("t2c-clermontferrand-card-editor")) {
  customElements.define("t2c-clermontferrand-card-editor", T2CClermontFerrandCardEditor);
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: "t2c-clermontferrand-card",
  name: "T2C Clermont-Ferrand Card",
  preview: true,
  description: "Affiche les prochains passages et perturbations d'un arret T2C.",
});

console.info(
  "%c T2C Clermont-Ferrand Card %c chargee ",
  "color: white; background: #b00010; font-weight: 700;",
  "color: #b00010; background: transparent; font-weight: 700;",
);

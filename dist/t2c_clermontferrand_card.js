window.t2cClermontFerrandCardVersion = "0.1.7";

console.info(
  "%c T2C Clermont-Ferrand Card %c chargement 0.1.7 ",
  "color: white; background: #b00010; font-weight: 700;",
  "color: #b00010; background: transparent; font-weight: 700;",
);

class T2CClermontFerrandCard extends HTMLElement {
  static getStubConfig() {
    return {
      entity: "",
      title: "",
      passages: 5,
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
        background: var(--t2c-header-color, #ab161b);
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
        background: var(--route-color, var(--t2c-line-color, #b00010));
        color: var(--route-text-color, #fff);
        font-weight: 700;
      }

      .t2c-destination,
      .t2c-info {
        overflow-wrap: anywhere;
      }

      .t2c-alert-icon {
        --mdc-icon-size: 22px;
        color: var(--warning-color, #f9ab00);
        cursor: help;
        vertical-align: middle;
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

    if (!this.config.entity) {
      wrapper.style.setProperty("--t2c-header-color", "#ab161b");
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
    wrapper.style.setProperty("--t2c-header-color", "#ab161b");

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
      const route = this._getRouteDisplay(state, lineLabel);

      if (!state) {
        row.innerHTML = `
          <td><span class="t2c-line">${this._escape(route.label)}</span></td>
          <td class="t2c-empty" colspan="3">Entite introuvable : ${this._escape(entityId)}</td>
        `;
      } else {
        row.style.setProperty("--route-color", route.color);
        row.style.setProperty("--route-text-color", route.textColor);
        const alert = this._getAlertDisplay(state);
        row.innerHTML = `
          <td><span class="t2c-line">${this._escape(route.label)}</span></td>
          <td class="t2c-destination">${this._escape(state.attributes.destination || "-")}</td>
          <td class="t2c-time">${this._escape(state.state || "-")}</td>
          <td class="t2c-info">${alert ? `<ha-icon class="t2c-alert-icon" icon="${this._escapeAttr(alert.icon)}" title="${this._escapeAttr(alert.tooltip)}"></ha-icon>` : ""}</td>
        `;
      }

      tbody.appendChild(row);
    }

    wrapper.appendChild(table);

    card.appendChild(style);
    card.appendChild(wrapper);
    this.replaceChildren(card);
  }

  _escape(value) {
    const div = document.createElement("div");
    div.textContent = String(value ?? "");
    return div.innerHTML;
  }

  _escapeAttr(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  _getRouteDisplay(state, fallbackLabel) {
    const attributes = state?.attributes || {};
    const label = this._getAttribute(attributes, ["line", "route_short_name", "route_id", "Route ID"]) || fallbackLabel || "?";
    const color = this._normalizeColor(
      this._getAttribute(attributes, ["route_color", "Route color", "route color"]) || this.config.color || "#b00010",
      "#b00010",
    );
    const textColor = this._normalizeColor(
      this._getAttribute(attributes, ["route_text_color", "Route text color", "route text color"]) || "#ffffff",
      "#ffffff",
    );

    return { label, color, textColor };
  }

  _getAlertDisplay(state) {
    const attributes = state?.attributes || {};
    const hasAlert = this._isTruthy(this._getAttribute(attributes, ["has_alert", "Has alert"]));
    const title = String(this._getAttribute(attributes, ["alert_title", "Alert title", "info"]) || "").trim();
    const text = String(this._getAttribute(attributes, ["alert_text", "Alert text"]) || "").trim();
    const updatedAt = this._getAttribute(attributes, ["updated_at", "Updated at"]);
    const icon = this._getAttribute(attributes, ["alert_icon", "Alert icon"]) || "mdi:alert-circle";

    if (!hasAlert && !title && !text) return undefined;
    if (!hasAlert && title.toLocaleLowerCase("fr-FR") === "aucune info" && !text) return undefined;

    const tooltip = [
      title ? `Titre : ${title}` : "",
      text ? `Texte : ${text}` : "",
      updatedAt ? `Mise a jour : ${this._formatUpdatedAt(updatedAt)}` : "",
    ].filter(Boolean).join("\n");

    return { icon, tooltip };
  }

  _isTruthy(value) {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value !== 0;
    if (typeof value === "string") {
      return ["true", "1", "yes", "oui"].includes(value.trim().toLocaleLowerCase("fr-FR"));
    }

    return false;
  }

  _getAttribute(attributes, names) {
    const normalizedEntries = Object.entries(attributes).map(([key, value]) => [
      key.toLocaleLowerCase("en-US").replace(/[^a-z0-9]/g, ""),
      value,
    ]);

    for (const name of names) {
      const normalizedName = name.toLocaleLowerCase("en-US").replace(/[^a-z0-9]/g, "");
      const match = normalizedEntries.find(([key]) => key === normalizedName);
      if (match && match[1] !== undefined && match[1] !== null && match[1] !== "") {
        return match[1];
      }
    }

    return undefined;
  }

  _normalizeColor(value, fallback) {
    if (!value) return fallback;
    const color = String(value).trim();
    if (/^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(color)) return color;
    if (/^[0-9a-f]{3}([0-9a-f]{3})?$/i.test(color)) return `#${color}`;
    return fallback;
  }
}

class T2CClermontFerrandCardEditor extends HTMLElement {
  setConfig(config) {
    this.config = {
      entity: "",
      title: "",
      passages: 5,
      color: "#b00010",
      ...config,
    };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    const signature = this._getPassageOptionsSignature();

    if (!this._rendered || signature !== this._passageOptionsSignature) {
      this._passageOptionsSignature = signature;
      this._render();
    }
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

    const passageOptions = this._getPassageOptions();

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
          <label for="entity">Arret</label>
          <select id="entity">
            <option value="">Selectionner un arret</option>
            ${passageOptions.map((state) => `
              <option value="${this._escapeAttr(state.entity_id)}" ${state.entity_id === this.config.entity ? "selected" : ""}>
                ${this._escapeHtml(this._getEntityLabel(state))}
              </option>
            `).join("")}
          </select>
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
      </div>
    `;

    for (const input of root.querySelectorAll("input, select")) {
      input.configValue = input.id;
      input.addEventListener("change", this._valueChanged.bind(this));
    }

    this.replaceChildren(root);
    this._rendered = true;
    this._passageOptionsSignature = this._getPassageOptionsSignature();
  }

  _getPassageOptions() {
    if (!this._hass?.states) return [];

    return Object.values(this._hass.states)
      .filter((state) => state.entity_id.startsWith("sensor.") && /_passage_1$/.test(state.entity_id))
      .sort((a, b) => {
        const labelA = this._getEntityLabel(a).toLocaleLowerCase("fr-FR");
        const labelB = this._getEntityLabel(b).toLocaleLowerCase("fr-FR");
        return labelA.localeCompare(labelB, "fr-FR");
      });
  }

  _getPassageOptionsSignature() {
    return this._getPassageOptions()
      .map((state) => `${state.entity_id}:${this._getEntityLabel(state)}`)
      .join("|");
  }

  _getEntityLabel(state) {
    const friendlyName = state.attributes?.friendly_name;
    if (friendlyName) return friendlyName.replace(/\s*passage\s*1\s*$/i, "");
    return state.entity_id;
  }

  _escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = String(value ?? "");
    return div.innerHTML;
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
  "%c T2C Clermont-Ferrand Card %c element enregistre ",
  "color: white; background: #b00010; font-weight: 700;",
  "color: #b00010; background: transparent; font-weight: 700;",
);

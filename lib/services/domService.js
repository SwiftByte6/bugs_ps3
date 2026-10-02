import { api } from "../api/client";
import { ENDPOINTS } from "../api/endpoints";

/**
 * DOM Analysis & Smart Apply Service connecting to Saarthi FastAPI backend
 */
export async function analyzeDom(domSnapshot) {
  try {
    return await api.post(ENDPOINTS.DOM_ANALYZE, { dom: domSnapshot });
  } catch (error) {
    console.warn("DOM Analysis backend fallback triggered:", error.message);
    return {
      success: false,
      error: error.message,
      form_fields: [],
    };
  }
}

export async function auditAccessibility(domSnapshot) {
  try {
    return await api.post(ENDPOINTS.DOM_AUDIT, { dom: domSnapshot });
  } catch (error) {
    console.warn("DOM Audit backend fallback triggered:", error.message);
    return {
      success: false,
      error: error.message,
      issues: [],
    };
  }
}

export async function mapDomFields(domFields, profileData) {
  try {
    return await api.post(ENDPOINTS.DOM_MAP_FIELDS, {
      fields: domFields,
      profile: profileData,
    });
  } catch (error) {
    console.warn("DOM Map Fields backend fallback triggered:", error.message);
    return {
      success: false,
      error: error.message,
      mappings: {},
    };
  }
}

export async function submitSmartApplication(applicationPayload) {
  try {
    return await api.post(ENDPOINTS.DOM_SUBMIT, applicationPayload);
  } catch (error) {
    console.warn("DOM Submit Application backend fallback triggered:", error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function getDemoHtml() {
  try {
    return await api.get(ENDPOINTS.DOM_DEMO_HTML);
  } catch (error) {
    return "<form><label for='name'>Full Name</label><input id='name' type='text' /></form>";
  }
}

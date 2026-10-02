import re
from html.parser import HTMLParser
from typing import Dict, Any, List, Optional


class DOMElementExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.elements: List[Dict[str, Any]] = []
        self.forms: List[Dict[str, Any]] = []
        self.headings: List[Dict[str, Any]] = []
        self.inputs: List[Dict[str, Any]] = []
        self.buttons: List[Dict[str, Any]] = []
        self.links: List[Dict[str, Any]] = []
        self.images: List[Dict[str, Any]] = []
        self.labels: Dict[str, str] = {}  # for_id -> label_text
        self.current_tag: Optional[str] = None
        self.current_attrs: Dict[str, str] = {}
        self.current_label_for: Optional[str] = None
        self.current_text: List[str] = []

    def handle_starttag(self, tag: str, attrs: list):
        attr_dict = dict(attrs)
        tag_lower = tag.lower()

        if tag_lower == "label":
            self.current_label_for = attr_dict.get("for")
            self.current_text = []

        elif tag_lower in ["input", "select", "textarea"]:
            elem = {
                "tag": tag_lower,
                "type": attr_dict.get("type", "text" if tag_lower == "input" else tag_lower),
                "id": attr_dict.get("id", ""),
                "name": attr_dict.get("name", ""),
                "placeholder": attr_dict.get("placeholder", ""),
                "required": "required" in attr_dict or attr_dict.get("aria-required") == "true",
                "aria_label": attr_dict.get("aria-label"),
                "aria_labelledby": attr_dict.get("aria-labelledby"),
                "aria_describedby": attr_dict.get("aria-describedby"),
                "autocomplete": attr_dict.get("autocomplete"),
                "label": ""  # populated later
            }
            self.inputs.append(elem)

        elif tag_lower in ["h1", "h2", "h3", "h4", "h5", "h6"]:
            self.current_tag = tag_lower
            self.current_attrs = attr_dict
            self.current_text = []

        elif tag_lower in ["button"] or (tag_lower == "input" and attr_dict.get("type") in ["submit", "button"]):
            self.current_tag = "button"
            self.current_attrs = attr_dict
            self.current_text = []

        elif tag_lower == "a":
            self.current_tag = "a"
            self.current_attrs = attr_dict
            self.current_text = []

        elif tag_lower == "img":
            self.images.append({
                "tag": "img",
                "src": attr_dict.get("src", ""),
                "alt": attr_dict.get("alt"),
                "aria_hidden": attr_dict.get("aria-hidden") == "true",
                "id": attr_dict.get("id", "")
            })

        elif tag_lower == "form":
            self.forms.append({
                "id": attr_dict.get("id", ""),
                "action": attr_dict.get("action", ""),
                "method": attr_dict.get("method", "GET")
            })

    def handle_endtag(self, tag: str):
        tag_lower = tag.lower()
        text_content = "".join(self.current_text).strip()

        if tag_lower == "label" and self.current_label_for:
            self.labels[self.current_label_for] = text_content
            self.current_label_for = None

        elif tag_lower in ["h1", "h2", "h3", "h4", "h5", "h6"]:
            level = int(tag_lower[1])
            self.headings.append({
                "level": level,
                "tag": tag_lower,
                "text": text_content,
                "id": self.current_attrs.get("id", "")
            })
            self.current_tag = None

        elif tag_lower == "button":
            self.buttons.append({
                "tag": "button",
                "id": self.current_attrs.get("id", ""),
                "type": self.current_attrs.get("type", "button"),
                "text": text_content,
                "aria_label": self.current_attrs.get("aria-label")
            })
            self.current_tag = None

        elif tag_lower == "a":
            self.links.append({
                "tag": "a",
                "href": self.current_attrs.get("href", ""),
                "text": text_content,
                "aria_label": self.current_attrs.get("aria-label")
            })
            self.current_tag = None

    def handle_data(self, data: str):
        if self.current_label_for or self.current_tag:
            self.current_text.append(data)


def analyze_dom(html_content: str) -> Dict[str, Any]:
    """Parse HTML and extract structural representation of DOM elements."""
    parser = DOMElementExtractor()
    parser.feed(html_content)

    # Link labels to inputs
    for inp in parser.inputs:
        elem_id = inp.get("id", "")
        elem_name = inp.get("name", "")
        if elem_id in parser.labels:
            inp["label"] = parser.labels[elem_id]
        elif elem_name in parser.labels:
            inp["label"] = parser.labels[elem_name]
        elif inp.get("aria_label"):
            inp["label"] = inp["aria_label"]

    return {
        "forms": parser.forms,
        "headings": parser.headings,
        "inputs": parser.inputs,
        "buttons": parser.buttons,
        "links": parser.links,
        "images": parser.images,
        "total_fields": len(parser.inputs)
    }


def audit_accessibility(dom_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Perform heuristic automated accessibility audit on extracted DOM data.
    IMPORTANT: This is an automated heuristic audit, NOT a certified WCAG compliance guarantee.
    """
    issues = []
    checks_passed = []

    # 1. Missing Labels Check
    unlabeled_inputs = []
    for inp in dom_data.get("inputs", []):
        has_label = bool(inp.get("label") or inp.get("aria_label") or inp.get("placeholder"))
        has_explicit_label = bool(inp.get("label") or inp.get("aria_label"))
        if not has_explicit_label:
            unlabeled_inputs.append(inp.get("name") or inp.get("id") or "unnamed_input")

    if unlabeled_inputs:
        issues.append({
            "severity": "high",
            "type": "missing_labels",
            "count": len(unlabeled_inputs),
            "message": f"{len(unlabeled_inputs)} form input(s) are missing accessible labels: {', '.join(unlabeled_inputs)}",
            "recommendation": "Associate explicit <label for='...'> tags or provide 'aria-label' attributes."
        })
    else:
        checks_passed.append("All form fields have associated labels or accessible names.")

    # 2. Images missing Alt Text
    unlabeled_images = []
    for img in dom_data.get("images", []):
        if img.get("alt") is None and not img.get("aria_hidden"):
            unlabeled_images.append(img.get("src") or img.get("id") or "unnamed_image")

    if unlabeled_images:
        issues.append({
            "severity": "medium",
            "type": "missing_alt_text",
            "count": len(unlabeled_images),
            "message": f"{len(unlabeled_images)} image(s) missing 'alt' text.",
            "recommendation": "Add descriptive 'alt' attribute or 'aria-hidden=\"true\"' if decorative."
        })
    else:
        checks_passed.append("Images have appropriate alt text or are marked decorative.")

    # 3. Heading Hierarchy Check
    headings = dom_data.get("headings", [])
    if not headings:
        issues.append({
            "severity": "medium",
            "type": "missing_headings",
            "count": 1,
            "message": "No HTML headings (<h1>-<h6>) found on the page.",
            "recommendation": "Structure document content using semantic heading tags starting with <h1>."
        })
    else:
        h1_count = len([h for h in headings if h["level"] == 1])
        if h1_count == 0:
            issues.append({
                "severity": "medium",
                "type": "missing_h1",
                "count": 1,
                "message": "Document is missing a primary <h1> heading.",
                "recommendation": "Add an <h1> heading describing the page purpose."
            })
        elif h1_count > 1:
            issues.append({
                "severity": "low",
                "type": "multiple_h1",
                "count": h1_count,
                "message": "Multiple <h1> headings found on the page.",
                "recommendation": "Use a single top-level <h1> per page for clearer navigation."
            })
        else:
            checks_passed.append("Proper top-level <h1> heading present.")

    # 4. Keyboard Navigation & Button Accessible Names
    unnamed_buttons = [b for b in dom_data.get("buttons", []) if not b.get("text") and not b.get("aria_label")]
    if unnamed_buttons:
        issues.append({
            "severity": "high",
            "type": "unnamed_buttons",
            "count": len(unnamed_buttons),
            "message": f"{len(unnamed_buttons)} button(s) lack accessible text or aria-label.",
            "recommendation": "Provide clear text content or aria-label for button elements."
        })
    else:
        checks_passed.append("All buttons have readable accessible names.")

    return {
        "disclaimer": "This analysis is an automated heuristic audit. It does NOT constitute a formal WCAG compliance certification.",
        "summary": {
            "total_issues": len(issues),
            "high_severity": len([i for i in issues if i["severity"] == "high"]),
            "medium_severity": len([i for i in issues if i["severity"] == "medium"]),
            "low_severity": len([i for i in issues if i["severity"] == "low"]),
            "checks_passed": len(checks_passed)
        },
        "issues": issues,
        "checks_passed": checks_passed
    }

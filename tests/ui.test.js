const assert = require("node:assert/strict");
const test = require("node:test");
class FakeTextNode {
  constructor(text) {
    this.nodeType = 3;
    this._text = String(text);
    this.parentNode = null;
  }

  get textContent() {
    return this._text;
  }

  set textContent(value) {
    this._text = String(value);
  }
}

class FakeClassList {
  constructor(element) {
    this.element = element;
    this.classes = new Set();
  }

  add(...classes) {
    classes.forEach((cls) => this.classes.add(cls));
    this.element._className = Array.from(this.classes).join(" ");
  }

  contains(cls) {
    return this.classes.has(cls);
  }
}

class FakeElement {
  constructor(tagName) {
    this.tagName = tagName.toUpperCase();
    this.children = [];
    this.parentNode = null;
    this.dataset = {};
    this.style = {};
    this.attributes = {};
    this._textContent = null;
    this._className = "";
    this.classList = new FakeClassList(this);
    this.ownerDocument = null;
  }

  get className() {
    return this._className;
  }

  set className(value) {
    this._className = String(value);
    this.classList.classes = new Set(
      this._className.split(/\s+/).filter(Boolean)
    );
  }

  appendChild(child) {
    this.children.push(child);
    child.parentNode = this;
    return child;
  }

  removeChild(child) {
    const index = this.children.indexOf(child);
    if (index >= 0) {
      this.children.splice(index, 1);
      child.parentNode = null;
    }
    return child;
  }

  get firstChild() {
    return this.children[0] || null;
  }

  setAttribute(name, value) {
    const stringValue = String(value);
    this.attributes[name] = stringValue;
    if (name === "id") {
      this.id = stringValue;
      if (this.ownerDocument) {
        this.ownerDocument._elementsById.set(stringValue, this);
      }
    }
  }

  get textContent() {
    if (this._textContent !== null) {
      return this._textContent;
    }
    return this.children.map((child) => child.textContent).join("");
  }

  set textContent(value) {
    this._textContent = String(value);
    this.children = [];
  }

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] || null;
  }

  querySelectorAll(selector) {
    const results = [];
    const isClassSelector = selector.startsWith(".");
    const classNames = isClassSelector ? selector.slice(1).split(".") : [];
    const tagName = isClassSelector ? null : selector.toUpperCase();

    const matches = (node) => {
      if (!(node instanceof FakeElement)) {
        return false;
      }
      if (isClassSelector) {
        return classNames.every((name) => node.classList.contains(name));
      }
      return node.tagName === tagName;
    };

    const walk = (node) => {
      if (matches(node)) {
        results.push(node);
      }
      if (node instanceof FakeElement) {
        node.children.forEach(walk);
      }
    };

    walk(this);
    return results;
  }
}

function createFakeDocument() {
  const document = {
    _elementsById: new Map(),
    body: null,
    createElement(tagName) {
      const element = new FakeElement(tagName);
      element.ownerDocument = document;
      return element;
    },
    createElementNS(_ns, tagName) {
      return this.createElement(tagName);
    },
    createTextNode(text) {
      return new FakeTextNode(text);
    },
    getElementById(id) {
      return this._elementsById.get(id) || null;
    },
    addEventListener() {},
    querySelectorAll(selector) {
      return this.body.querySelectorAll(selector);
    }
  };

  document.body = document.createElement("body");
  return document;
}

function loadUIWithDom() {
  const document = createFakeDocument();
  const container = document.createElement("div");
  container.setAttribute("id", "recommendations-container");
  document.body.appendChild(container);

  global.window = { innerWidth: 0 };
  global.document = document;

  delete require.cache[require.resolve("../ui.js")];
  return require("../ui.js");
}

test("renderRecommendations creates service cards with text content", () => {
  const ui = loadUIWithDom();
  const recommendations = {
    critical: [
      {
        service: "Oil Change",
        overdue: true,
        due: 30000,
        milesUntil: -500,
        price: 59.99,
        labor_hours: 1.2
      }
    ]
  };

  ui.renderRecommendations(recommendations);

  const container = document.getElementById("recommendations-container");
  const serviceName = container.querySelector(".service-name");
  const details = container.querySelector(".service-details");
  const amount = container.querySelector(".price-amount");
  const labor = container.querySelector(".labor-hours");
  const checkbox = container.querySelector(".service-toggle");

  assert.equal(serviceName.textContent, "Oil Change");
  assert.equal(details.textContent, "OVERDUE - Due at 30,000 mi");
  assert.equal(amount.textContent, "$59.99");
  assert.equal(labor.textContent, "1.2h labor");
  assert.ok(checkbox);
});

test("renderRecommendations shows an empty state when no services exist", () => {
  const ui = loadUIWithDom();

  ui.renderRecommendations({});

  const container = document.getElementById("recommendations-container");
  const emptyState = container.querySelector(".empty-state");
  const icon = container.querySelector("svg");

  assert.ok(emptyState);
  assert.equal(emptyState.querySelector("h3").textContent, "All caught up!");
  assert.equal(emptyState.querySelector("p").textContent, "No services due at this mileage");
  assert.ok(icon);
});

import "./style.css";

const fileInput: HTMLInputElement = document.querySelector("#svgInput")!;
const makePretty: HTMLButtonElement = document.querySelector("#makePretty")!;
const showFront: HTMLButtonElement = document.querySelector("#showFront")!;
const showBack: HTMLButtonElement = document.querySelector("#showBack")!;
const exportBtn: HTMLButtonElement = document.querySelector("#export")!;

const front: SVGSVGElement = document.querySelector("#front")!;
const back: SVGSVGElement = document.querySelector("#back")!;

// Keep track of the width and height
// We don't set this on the DOM preview (so the SVG fits to size)
// but we do want to include it in the export
let width: string = "";
let height: string = "";

const makeGroup = (children: NodeListOf<Element>) => {
  const root = document.createElementNS("http://www.w3.org/2000/svg", "g");
  children.forEach((c) => root.appendChild(c.cloneNode(true)));
  return root;
};

const replaceColor = (elements: NodeListOf<Element>, color: string) => {
  const getNewStyle = (style: string) => {
    if (style.includes("fill-opacity:0.0") && style.includes("stroke:none")) {
      // no fill or stroke
      return style;
    } else if (
      style.includes("fill-opacity:0.0") ||
      style.includes("fill:none")
    ) {
      // stroke, no fill
      return style + `;stroke:${color};stroke-opacity:1`;
    } else if (style.includes("stroke:none")) {
      // fill, no stroke
      return style + `;fill:${color};fill-opacity:1;`;
    } else {
      // fill and stroke
      return (
        style + `;fill:${color};stroke:${color};fill-opacity:1;stroke-opacity:1`
      );
    }
  };

  elements.forEach((node) => {
    const style = node.getAttribute("style");

    if (style === null) {
      // inherit...
      // does its direct parent have a fill or stroke set? copy it
      const parentStyle = node.parentElement?.getAttribute("style");
      if (parentStyle) {
        node.setAttribute("style", getNewStyle(parentStyle));
      } else {
        // try just one more step up (sometimes happens on kicad 7)
        const parentParentStyle =
          node.parentElement?.parentElement?.getAttribute("style");
        if (parentParentStyle) {
          node.setAttribute("style", getNewStyle(parentParentStyle));
        }
      }
      return;
    } else {
      node.setAttribute("style", getNewStyle(style));
    }
  });
};

const getSelectorForColor = (color: string) => {
  const elements = [
    "path",
    "rect",
    "circle",
    "text",
    "g.stroked-text",
    `g[style*="fill:none"]`,
  ];

  return (
    elements
      .map(
        (e) => `${e}[style*="fill:#${color}"], ${e}[style*="stroke:#${color}"]`
      )
      .join(", ") +
    `, g[style*="fill:#${color}"] > circle:not([style*="fill:"]), g[style*="fill:#${color}"] > path:not([style*="fill:"]), g[style*="fill:#${color}"] > g.stroked-text > path, g[style*="fill:#${color}"] > g:not([style]) > circle:not([style*="fill:"])`
  );
};

makePretty.onclick = async () => {
  if (fileInput.files!.length < 1) return;

  const file = fileInput.files![0];
  const svgData = await file.text();

  const parser = new DOMParser();
  const svgDocument = parser.parseFromString(svgData, "image/svg+xml");
  const svgRoot = svgDocument.documentElement;

  const viewBox = svgRoot.getAttribute("viewBox") ?? "";
  width = svgRoot.getAttribute("width") ?? "";
  height = svgRoot.getAttribute("height") ?? "";

  const frontMask = svgRoot.querySelectorAll(getSelectorForColor("D864FF"));
  const backSilk = svgRoot.querySelectorAll(getSelectorForColor("E8B2A7"));
  const backMask = svgRoot.querySelectorAll(getSelectorForColor("02FFEE"));
  const backCopper = svgRoot.querySelectorAll(getSelectorForColor("4D7FC4"));
  const frontSilk = svgRoot.querySelectorAll(getSelectorForColor("F2EDA1"));
  const edgeCuts = svgRoot.querySelectorAll(getSelectorForColor("D0D2CD"));
  const frontCopper = svgRoot.querySelectorAll(getSelectorForColor("C83434"));

  // old KiCAD uses black drawings, new KiCad uses this magenta color
  const userDwgs = svgRoot.querySelectorAll(
    `*[style*="stroke:#000000"]:not(:has(*[style*="fill:"])), *[style*="stroke:#C872AB"]`
  );
  const vias = svgRoot.querySelectorAll(
    `*[style*="fill:#FFFFFF"]:not(:has(*[style*="fill:"]))`
  );

  const maskColorBase =
    document.querySelector<HTMLInputElement>("#maskNoCu")!.value;
  const maskColorCopper =
    document.querySelector<HTMLInputElement>("#maskWithCu")!.value;
  const bareCopperColor =
    document.querySelector<HTMLInputElement>("#bareCu")!.value;
  const silkColor = document.querySelector<HTMLInputElement>("#silk")!.value;
  const cutsColor = document.querySelector<HTMLInputElement>("#cuts")!.value;
  const frameColor = document.querySelector<HTMLInputElement>("#frame")!.value;
  const viasColor = document.querySelector<HTMLInputElement>("#vias")!.value;

  replaceColor(frontMask, bareCopperColor);
  replaceColor(frontSilk, silkColor);
  replaceColor(frontCopper, maskColorCopper);
  replaceColor(backMask, bareCopperColor);
  replaceColor(backSilk, silkColor);
  replaceColor(backCopper, maskColorCopper);
  replaceColor(edgeCuts, cutsColor);
  replaceColor(vias, viasColor);

  [...frontCopper, ...backCopper].forEach((node) => {
    node
      .querySelectorAll(`:scope *[style*="fill:#ECECEC"]`)
      .forEach((node) => node.remove());
  });

  userDwgs.forEach((node) => {
    const style = node.getAttribute("style");
    node.setAttribute(
      "style",
      style + `;stroke:${frameColor};fill-opacity:0;stroke-opacity:1`
    );
  });

  document
    .querySelector("#frontBg")!
    .setAttribute("style", `fill: ${maskColorBase}`);
  document
    .querySelector("#backBg")!
    .setAttribute("style", `fill: ${maskColorBase}`);

  document.querySelector("#front")?.setAttribute("viewBox", viewBox);
  document.querySelector("#back")?.setAttribute("viewBox", viewBox);

  document.querySelector("#frontMask")!.replaceChildren(makeGroup(frontMask));
  document.querySelector("#backSilk")!.replaceChildren(makeGroup(backSilk));
  document.querySelector("#backMask")!.replaceChildren(makeGroup(backMask));
  document.querySelector("#backCopper")!.replaceChildren(makeGroup(backCopper));
  document.querySelector("#backVias")!.replaceChildren(makeGroup(vias));
  document.querySelector("#frontSilk")!.replaceChildren(makeGroup(frontSilk));
  document
    .querySelector("#frontEdgeCuts")!
    .replaceChildren(makeGroup(edgeCuts));
  document.querySelector("#backEdgeCuts")!.replaceChildren(makeGroup(edgeCuts));
  document
    .querySelector("#frontCopper")!
    .replaceChildren(makeGroup(frontCopper));
  document.querySelector("#frontVias")!.replaceChildren(makeGroup(vias));
  document.querySelector("#frontDwgs")!.replaceChildren(makeGroup(userDwgs));
  document.querySelector("#backDwgs")!.replaceChildren(makeGroup(userDwgs));
};

let showing: "front" | "back" = "front";

showFront.onclick = () => {
  front.style.display = "block";
  back.style.display = "none";
  showing = "front";
};

showBack.onclick = () => {
  front.style.display = "none";
  back.style.display = "block";
  showing = "back";
};

const downloadSvg = (svg: SVGSVGElement, filename: string) => {
  const svgElement = svg.cloneNode(true) as SVGSVGElement;
  svgElement.removeAttribute("id");
  svgElement.setAttribute("width", width);
  svgElement.setAttribute("height", height);

  const clientrect = svg.getBBox();
  const viewBox =
    clientrect.x +
    " " +
    clientrect.y +
    " " +
    clientrect.width +
    " " +
    clientrect.height;
  console.log(viewBox);

  const linkElement = document.createElement("a");

  const prelude = `<?xml version="1.0" standalone="no"?>
 <!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN"
 "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
 `;

  linkElement.setAttribute(
    "href",
    "data:text/plain;base64," + btoa(prelude + svgElement.outerHTML)
  );
  linkElement.setAttribute("download", filename);

  linkElement.style.display = "none";
  document.body.appendChild(linkElement);

  linkElement.click();

  document.body.removeChild(linkElement);
};

exportBtn.onclick = () => {
  if (showing === "front") {
    downloadSvg(front, "front.svg");
  } else {
    downloadSvg(back, "back.svg");
  }
};

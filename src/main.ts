import "./style.css";

const fileInput: HTMLInputElement = document.querySelector("#svgInput")!;
const makePretty: HTMLButtonElement = document.querySelector("#makePretty")!;
const showFront: HTMLButtonElement = document.querySelector("#showFront")!;
const showBack: HTMLButtonElement = document.querySelector("#showBack")!;
const exportBtn: HTMLButtonElement = document.querySelector("#export")!;

const front: SVGSVGElement = document.querySelector("#front")!;
const back: SVGSVGElement = document.querySelector("#back")!;

const makeSVG = (children: NodeListOf<Element>) => {
  const root = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  root.setAttribute("viewBox", "0.0000 0.0000 297.0022 210.0072");
  children.forEach((c) => root.appendChild(c.cloneNode(true)));
  return root;
};

const replaceColor = (elements: NodeListOf<Element>, color: string) => {
  elements.forEach((node) => {
    const style = node.getAttribute("style");

    if (style?.includes("fill-opacity:0.0")) {
      // stroke
      node.setAttribute("style", style + `;stroke:${color};stroke-opacity:1`);
    } else {
      // fill
      node.setAttribute(
        "style",
        style + `;fill:${color};stroke:${color};fill-opacity:1;stroke-opacity:1`
      );
    }
  });
};

makePretty.onclick = async () => {
  if (fileInput.files!.length < 1) return;

  const file = fileInput.files![0];
  const svgData = await file.text();

  const parser = new DOMParser();
  const svgDocument = parser.parseFromString(svgData, "image/svg+xml");
  const svgRoot = svgDocument.documentElement;

  const frontMask = svgRoot.querySelectorAll(`*[style*="fill:#D864FF"]`);
  const backSilk = svgRoot.querySelectorAll(`*[style*="fill:#E8B2A7"]`);
  const backMask = svgRoot.querySelectorAll(`*[style*="fill:#02FFEE"]`);
  const backCopper = svgRoot.querySelectorAll(`*[style*="fill:#4D7FC4"]`);
  const frontSilk = svgRoot.querySelectorAll(`*[style*="fill:#F2EDA1"]`);
  const edgeCuts = svgRoot.querySelectorAll(`*[style*="fill:#D0D2CD"]`);
  const frontCopper = svgRoot.querySelectorAll(`*[style*="fill:#C83434"]`);
  const userDwgs = svgRoot.querySelectorAll(
    `*[style*="stroke:#000000"]:not(:has(*[style*="fill:"]))`
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

  document.querySelector("#frontMask")!.replaceChildren(makeSVG(frontMask));
  document.querySelector("#backSilk")!.replaceChildren(makeSVG(backSilk));
  document.querySelector("#backMask")!.replaceChildren(makeSVG(backMask));
  document.querySelector("#backCopper")!.replaceChildren(makeSVG(backCopper));
  document.querySelector("#backVias")!.replaceChildren(makeSVG(vias));
  document.querySelector("#frontSilk")!.replaceChildren(makeSVG(frontSilk));
  document.querySelector("#frontEdgeCuts")!.replaceChildren(makeSVG(edgeCuts));
  document.querySelector("#backEdgeCuts")!.replaceChildren(makeSVG(edgeCuts));
  document.querySelector("#frontCopper")!.replaceChildren(makeSVG(frontCopper));
  document.querySelector("#frontVias")!.replaceChildren(makeSVG(vias));
  document.querySelector("#frontDwgs")!.replaceChildren(makeSVG(userDwgs));
  document.querySelector("#backDwgs")!.replaceChildren(makeSVG(userDwgs));
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
  var element = document.createElement("a");
  element.setAttribute(
    "href",
    "data:text/plain;charset=utf-8," + encodeURIComponent(svg.outerHTML)
  );
  element.setAttribute("download", filename);

  element.style.display = "none";
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
};

exportBtn.onclick = () => {
  if (showing === "front") {
    downloadSvg(front, "front.svg");
  } else {
    downloadSvg(back, "back.svg");
  }
};

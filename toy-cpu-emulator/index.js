const height = 625;
const width = 410;
const onColor = "#ff0000";
const offColor = "#660000";
const canvas = document.getElementById("canvas");
canvas.height = height;
canvas.width = width;
const ctx = canvas.getContext("2d");
ctx.fillStyle = offColor;

let isEditMode = false;

let speed = 1; //Hz
let counter = 0;
let instruction = 0;
let instructionSetBit = 0;
let accumulator = 0;
let instructions = [];

let isBinary = false;

const instructionsDict = {
  STOP: 0b00000000, //0
  RIGHT: 0b00000001, //1
  LEFT: 0b00000010, //2
  NOT: 0b00001111, //15
  AND: 0b00010001, //17
  OR: 0b00010010, //18
  XOR: 0b00010011, //19
  LOAD: 0b00010100, //20
  STORE: 0b00010101, //21
  ADD: 0b00010110, //22
  SUB: 0b00010111, //23
  GOTO: 0b00011000, //24
  IFZERO: 0b00011001, //25
  NOP: 0b10000000, //128
};
const {
  STOP,
  RIGHT,
  LEFT,
  NOT,
  AND,
  OR,
  XOR,
  LOAD,
  STORE,
  ADD,
  SUB,
  GOTO,
  IFZERO,
  NOP,
} = { ...instructionsDict };
const instructionNames = {};
Object.keys(instructionsDict).map(
  (k) => (instructionNames[instructionsDict[k]] = k)
);

const flashLights = [
  LOAD,
  7,
  LOAD,
  8,
  LOAD,
  9,
  STOP,
  0b00001111,
  0b11110000,
  0b11111111,
];

const flashLights1 = [LOAD, 7, NOT, OR, 7, NOP, STOP, 0b00001111];

const moveLight = [LOAD, 8, RIGHT, IFZERO, 7, GOTO, 2, STOP, 0b10000000];

const countDown = [
  LOAD,
  9,
  SUB,
  10,
  IFZERO,
  8,
  GOTO,
  2,
  STOP,
  0b00001111,
  0b00000001,
];

const add = [LOAD, 7, ADD, 8, STORE, 9, STOP, 1, 2, 0];
const compare = [LOAD, 9, XOR, 10, IFZERO, 8, LOAD, 11, STOP, 5, 1, 0b11111111];
const test = [XOR, 10, IFZERO, 8, LOAD, 11, STOP];

instructions = flashLights;

const assemble = () => {
  const codeString = code.value;
  const lines = codeString.split("\n");
  const commands = [];
  const labels = {};
  lines.forEach((line, index) => {
    const bytes = line.split(" ");
    bytes.forEach((byte) => {
      if (byte.startsWith(":")) {
        labels[byte.slice(1)] = index;
      } else if (byte) {
        commands.push(instructionsDict[byte] ?? parseInt(byte));
      }
    });
  });
  instructions = commands;
  code.value = instructions;

  updateUi(true);
};
const assembleAndRun = async () => {
  assemble();
  await run();
};
const code = document.querySelector("#code");

const drawCircle = (x, y, radius, start = 0, end = 2 * Math.PI) => {
  ctx.beginPath();
  ctx.arc(x, y, radius, start, end);
  ctx.fill();
};

const drawLeds = (x, y, binaryNumber) => {
  for (let i = 0; i < 8; i++) {
    let isOn = (binaryNumber >> i) & (1 === 1);
    ctx.fillStyle = isOn ? onColor : offColor;
    drawCircle(x - i * 50, y, 20);
  }
};

const getValue = (address) => {
  const location = instructions[address];
  const value = instructions[location];
  return value;
};

const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const delay = async () => {
  update();
  await sleep((1 / speed) * 1000);
  instruction = instructions[counter];
};

const step = () => {
  switch (instruction) {
    case LOAD:
      accumulator = getValue(++counter); //get address and then get value at address
      break;
    case STORE:
      instructions[getValue(++counter)] = accumulator;
      break;
    case NOT:
      accumulator = ~accumulator & 0b11111111;
      break;
    case OR:
      accumulator |= getValue(++counter);
      break;
    case AND:
      accumulator &= getValue(++counter);
      break;
    case XOR:
      accumulator ^= getValue(++counter);
      break;
    case RIGHT:
      accumulator = accumulator >> 1;
      break;
    case LEFT:
      accumulator = accumulator << 1;
      break;
    case IFZERO:
      if (accumulator === 0) {
        counter = instructions[++counter]; //will be counter + 1 at end
        return true;
      }
      break;
    case GOTO:
      counter = instructions[++counter];
      return true;
    case SUB:
      accumulator -= getValue(++counter);
      break;
    case ADD:
      accumulator += getValue(++counter);
      break;
    case NOP:
      break;
  }
};

const stepOnce = async () => {
  const skip = step();
  if (skip) {
    return;
  }
  counter++;
  instruction = instructions[counter];
  update();
};

const reset = () => {
  counter = 0;
  accumulator = 0;
  instruction = instructions[counter];
  update();
};

const run = async () => {
  reset();
  while (instruction != STOP) {
    await stepOnce();
    await delay();
  }
};
document.querySelector("#run").onclick = run;
document.querySelector("#reset").onclick = reset;
document.querySelector("#step").onclick = stepOnce;
const disasm = document.querySelector("#disassemble");
disasm.onclick = () => disassemble(instructions);

const asmBtn = document.querySelector("#assemble");
asmBtn.onclick = assemble;

const asmR = document.querySelector("#assembleAndRun");
asmR.onclick = assembleAndRun;
/**
 * 
 * @param {boolean} isBinary1 
 */
const updateUi = (isBinary1) => {
  disasm.disabled = !isBinary1;
  asmBtn.disabled = isBinary1;
  asmR.disabled = isBinary1;
  isBinary = isBinary1;
};

const disassemble = (instructions) => {
  const output = [];
  let isStop = false;
  const getName = (ins) =>
    `0x${ins.toString(16).toUpperCase().padStart(2, "0")}`;
  for (let i = 0; i < instructions.length; i++) {
    const instruction = instructions[i];
    const name = isStop ? getName(instruction) : instructionNames[instruction];
    switch (instruction) {
      case RIGHT:
      case LEFT:
      case AND:
      case OR:
      case XOR:
      case LOAD:
      case ADD:
      case SUB:
      case GOTO:
      case IFZERO:
        const operand = instructions[++i];
        output.push(`${name} ${operand}`);
        break;
      case STOP:
      case NOT:
      case NOP:
        if (instruction === STOP) {
          isStop = true;
        }
        output.push(name);
        break;
      default:
        output.push(`0x${instruction.toString(16).toUpperCase()}`);
        break;
    }
    output.push("\n");
  }
  code.value = output.join("");

  updateUi(false);

  return code.value;
};

const download = function () {
  const link = document.createElement("a");
  const name = "toy_cpu_binary.tc";
  let blob;
  if(isBinary) {
    const arr = code.value.split(",").map(x => parseInt(x))
    content = new Uint8Array(arr).buffer;
    blob = new Blob([content], { type: "application/octet-stream" });
    link.download = `${name}b`;
  } else {
    blob = new Blob([code.value], { type: "application/octet-stream" })
    link.download = `${name}s`;
  }
  const data = URL.createObjectURL(blob);
  link.href = data;
  link.click();
  URL.revokeObjectURL(link.href);
};
document.querySelector("#download").onclick = download;

const fileInput = document.getElementById("upload");
fileInput.onchange = (e) => {
  const selectedFile = e.srcElement.files[0];
  const isBinaryFile = selectedFile.name.endsWith(".tcb");
  const reader = new FileReader();
  reader.onload = (e) => {
    if(isBinaryFile) {      
      const buffer = e.target.result;
      const view = new Uint8Array(buffer);
      code.value = view.map(x => x.toString()).join(",");
      instructions = view;
    }
  };
  reader.readAsArrayBuffer(selectedFile);

  if(!isBinaryFile) {
    const reader1 = new FileReader();
    reader1.onload = (e) => {
      code.value = e.target.result;
      instructions = [];
    };
    reader1.readAsText(selectedFile);
  }  
  updateUi(isBinaryFile);
};

const speedInput = document.querySelector("#speed");
speedInput.value = speed;
speedInput.onchange = (e) => (speed = parseInt(e.target.value));

const programsDict = {
  flashLights: flashLights,
  flashLights1: flashLights1,
  moveLight: moveLight,
  countDown: countDown,
  add: add,
  compare: compare,
  test: test,
};
const select = document.querySelector("#choice");
// Object.keys(programsDict).map((k) => {
//   const option = document.createElement("option");
//   (option.value = k), (option.innerText = k);
//   select.appendChild(option);
// });
select.onchange = (e) => {
  instructions = programsDict[e.target.value];
  code.value = disassemble(instructions);
  reset();
};

/**
 *
 * @param {number} endX
 * @param {number} y
 */
const drawInstruction = (endX, y) => {
  for (let i = 0; i < 8; i++) {
    let isOn = (instructions[counter] >> i) & (1 === 1);
    ctx.fillStyle = isOn ? onColor : offColor;
    drawCircle(endX - i * 50, y, 20);
    if (instructionSetBit === i && isEditMode) {
      ctx.fillStyle = offColor;
      ctx.fillRect(endX - i * 50 - 10, y + 25, 20, 5);
    }
  }
};

const update = () => {
  ctx.clearRect(0, 0, width, height);
  ctx.beginPath();
  ctx.font = "23px Arial";

  let startX = 5;
  let startY = 25;
  let spacing = 45;

  ctx.fillText("Counter: " + counter, startX, startY);  
  startY += spacing * 0.6;
  drawLeds(startX + 370, startY, counter);

  ctx.fillStyle = offColor;
  startY += spacing;
  ctx.fillText("Instruction", startX, startY);
  startY += spacing * 0.6;
  drawInstruction(startX + 370, startY);

  ctx.fillStyle = offColor;
  startY += spacing;
  ctx.fillText(
    `Accumulator: 0x${accumulator
      .toString(16)
      .toUpperCase()
      .padStart(2, "0")} ${accumulator}`,
    startX,
    startY
  );
  startY += spacing * 0.6;
  drawLeds(startX + 370, startY, accumulator);

  ctx.fillStyle = offColor;
  startY += spacing;
  ctx.fillText("INI  HLT ERR ABT RUN EDT INP PWR", startX, startY);
  startY += spacing * 0.6;
  drawLeds(startX + 370, startY);

  const x1 = startX;
  const y1 = startY + 40;
  ctx.font = "16px Arial";
  ctx.fillText("_ _ _ _ _ _ _ _ STOP", x1, y1 + 20 * 0);
  ctx.fillText("_ _ _ _ _ _ _ o RIGHT", x1, y1 + 20 * 1);
  ctx.fillText("_ _ _ _ _ _ o _ LEFT", x1, y1 + 20 * 2);
  ctx.fillText("_ _ _ _ o o o o NOT", x1, y1 + 20 * 3);
  ctx.fillText("_ _ _ o _ _ _ o AND addr", x1, y1 + 20 * 4);
  ctx.fillText("_ _ _ o _ _ o _ OR addr", x1, y1 + 20 * 5);
  ctx.fillText("_ _ _ o _ _ o o XOR addr", x1, y1 + 20 * 6);
  ctx.fillText("_ _ _ o _ o _ _ LOAD addr", x1, y1 + 20 * 7);
  ctx.fillText("_ _ _ o _ o _ o STORE addr", x1, y1 + 20 * 8);
  ctx.fillText("_ _ _ o _ o o _ ADD addr", x1, y1 + 20 * 9);
  ctx.fillText("_ _ _ o _ o o o SUB addr", x1, y1 + 20 * 10);
  ctx.fillText("_ _ _ o o _ _ _ GOTO addr", x1, y1 + 20 * 11);
  ctx.fillText("_ _ _ o o _ _ o IFZERO addr", x1, y1 + 20 * 12);
  ctx.fillText("o _ _ _ _ _ _ _ NOP", x1, y1 + 20 * 13);
  
  ctx.font = "23px Arial";
  ctx.fillText("Mode: " + (isEditMode ? "Edit" : "Input"), x1, y1 + 20 * 15);
};

const init = () => {
  code.value = disassemble(instructions);
  update();
  disasm.disabled = true;
};
init();

document.addEventListener("keydown", (e) => {
  if (isEditMode) {
    if (e.key === "ArrowLeft") {
      //left
      instructionSetBit += 1;
      instructionSetBit %= 8;
      update();
    } else if (e.key === "ArrowRight") {
      //right
      if (instructionSetBit > 0) {
        instructionSetBit -= 1;
      } else {
        instructionSetBit = 7;
      }
      update();
    } else if (e.key === " ") {
      //space
      e.preventDefault();
      const currentBit =
        (instructions[counter] >> instructionSetBit) & (1 === 1);
      instructions[counter] = instructions[counter] ^ (1 << instructionSetBit);
      update();
    } else if (e.key === "Enter") {
      //enter
      isEditMode = false;
      update();
    }
  } else {
    if (e.key === "ArrowUp") {
      //up
      e.preventDefault();
      if (counter > 0) {
        counter -= 1;
      } else {
        counter = 255;
      }
      update();
    } else if (e.key === "ArrowDown") {
      //down
      e.preventDefault();
      counter += 1;
      counter %= 256;
      update();
    } else if (e.key === "Enter") {
      //enter
      isEditMode = true;
      update();
    } else if (e.key === "r") {
      //r
      run();
    }
  }
});

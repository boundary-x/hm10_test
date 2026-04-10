// HM-10 UUID
const UART_SERVICE_UUID        = "0000ffe0-0000-1000-8000-00805f9b34fb";
const UART_CHARACTERISTIC_UUID = "0000ffe1-0000-1000-8000-00805f9b34fb";

let bluetoothDevice    = null;
let txCharacteristic   = null;          // HM-10은 TX/RX 단일 캐릭터리스틱
let isConnected        = false;
let bluetoothStatus    = "연결 대기 중";

function setup() {
  noCanvas();
  createBluetoothUI();
  createKeypadUI();
}

function createBluetoothUI() {
  const statusElement = select("#bluetoothStatus");
  if (statusElement) statusElement.html(`상태: ${bluetoothStatus}`);

  const buttonContainer = select("#bluetooth-control-buttons");
  if (buttonContainer) {
    const connectButton = createButton("기기 연결").addClass("start-button");
    connectButton.mousePressed(connectBluetooth);
    buttonContainer.child(connectButton);

    const disconnectButton = createButton("연결 해제").addClass("stop-button");
    disconnectButton.mousePressed(disconnectBluetooth);
    buttonContainer.child(disconnectButton);
  }
}

function createKeypadUI() {
  const keypadContainer = select("#keypad-container");
  if (!keypadContainer) return;

  for (let i = 1; i <= 12; i++) {
    let btn = createButton(String(i));
    btn.addClass("key-button");
    btn.mousePressed(() => handleKeypadInput(i));
    keypadContainer.child(btn);
  }
}

function handleKeypadInput(number) {
  if (!isConnected) {
    alert("먼저 HM-10과 연결해주세요.");
    return;
  }
  const dataToSend = String(number);
  sendBluetoothData(dataToSend);

  const display = select("#sentDataDisplay");
  if (display) {
    display.html(dataToSend);
    display.style("color", "#fff");
    setTimeout(() => display.style("color", "#0f0"), 200);
  }
}

function updateBluetoothStatusUI(type) {
  const el = select("#bluetoothStatus");
  if (el) {
    el.removeClass("status-connected");
    el.removeClass("status-error");
    el.html(`상태: ${bluetoothStatus}`);
    if (type === "connected") el.addClass("status-connected");
    else if (type === "error") el.addClass("status-error");
  }
}

async function connectBluetooth() {
  try {
    bluetoothDevice = await navigator.bluetooth.requestDevice({
      filters: [{ name: "kwon" }],                        // ← HM-10 이름
      optionalServices: [UART_SERVICE_UUID],
    });
    const server  = await bluetoothDevice.gatt.connect();
    const service = await server.getPrimaryService(UART_SERVICE_UUID);
    txCharacteristic = await service.getCharacteristic(UART_CHARACTERISTIC_UUID);

    isConnected    = true;
    bluetoothStatus = `${bluetoothDevice.name} 연결됨`;
    updateBluetoothStatusUI("connected");

  } catch (error) {
    console.error("Connection failed", error);
    bluetoothStatus = "연결 실패 (다시 시도해주세요)";
    updateBluetoothStatusUI("error");
  }
}

function disconnectBluetooth() {
  if (bluetoothDevice && bluetoothDevice.gatt.connected) {
    bluetoothDevice.gatt.disconnect();
  }
  isConnected      = false;
  bluetoothDevice  = null;
  txCharacteristic = null;
  bluetoothStatus  = "연결 해제됨";
  updateBluetoothStatusUI("default");
}

async function sendBluetoothData(data) {
  if (!txCharacteristic || !isConnected) return;
  try {
    const encoder = new TextEncoder();
    await txCharacteristic.writeValue(encoder.encode(`${data}\n`));
    console.log("Sent:", data);
  } catch (e) {
    console.error("Send error:", e);
    alert("데이터 전송 중 오류가 발생했습니다.");
  }
}

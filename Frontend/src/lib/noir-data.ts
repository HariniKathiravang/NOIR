export type DeviceStatus = "Normal" | "Warning" | "Alert";
export type BatchStatus = "Pending" | "Verified" | "Alert";

export type Device = {
  id: string;
  name: string;
  location: string;
  lastSeen: string;
  temperature: number;
  humidity: number;
  status: DeviceStatus;
  battery: number;
  serial: string;
};

export type Batch = {
  id: string;
  deviceId: string;
  range: string;
  readings: number;
  status: BatchStatus;
  txHash: string;
  merkleRoot: string;
};

export const devices: Device[] = [
  { id: "truck-14", name: "Truck-14", location: "En route · Tema → Accra", lastSeen: "18 seconds ago", temperature: 3.8, humidity: 67, status: "Normal", battery: 86, serial: "NR-T14-0092" },
  { id: "warehouse-a-rack-3", name: "Warehouse-A Rack 3", location: "Tema Export Terminal", lastSeen: "42 seconds ago", temperature: 4.2, humidity: 64, status: "Normal", battery: 74, serial: "NR-WA3-0204" },
  { id: "truck-22", name: "Truck-22", location: "En route · Kumasi → Tema", lastSeen: "1 minute ago", temperature: 9.4, humidity: 79, status: "Alert", battery: 52, serial: "NR-T22-0118" },
  { id: "cold-room-02", name: "Cold Room 02", location: "Akosombo Packhouse", lastSeen: "2 minutes ago", temperature: 5.7, humidity: 72, status: "Warning", battery: 61, serial: "NR-CR2-0177" },
  { id: "container-msc-481", name: "Container MSC-481", location: "Port of Tema · Bay 7", lastSeen: "4 minutes ago", temperature: 2.9, humidity: 65, status: "Normal", battery: 93, serial: "NR-M81-0310" },
];

const batchHashes = {
  pending: { tx: "0x4a2f98d71126c723c3647045ee9c1d", root: "0x7b2a0df97a33e5c668c9c3acaf18ce93aef072e3" },
  verified: { tx: "0x71bc4e1841a7f0f4a09921f112cd8a", root: "0x1e64b9fa178c9d7d348edaa27e3dbd839d506fe1" },
  alert: { tx: "0xd8120cc5813cb723137bee301aac44", root: "0xf43a381990dc842e31b4c5f33e09f4a3e45d8772" },
};

export const batchesFor = (deviceId: string): Batch[] => [
  { id: "BAT-2026-0927-A", deviceId, range: "Sep 27, 08:00–16:00 UTC", readings: 481, status: "Pending", txHash: batchHashes.pending.tx, merkleRoot: batchHashes.pending.root },
  { id: "BAT-2026-0926-C", deviceId, range: "Sep 26, 16:00–23:59 UTC", readings: 480, status: "Verified", txHash: batchHashes.verified.tx, merkleRoot: batchHashes.verified.root },
  { id: "BAT-2026-0926-B", deviceId, range: "Sep 26, 08:00–16:00 UTC", readings: 479, status: "Alert", txHash: batchHashes.alert.tx, merkleRoot: batchHashes.alert.root },
];

export const temperatureData = [
  { time: "00:00", temperature: 3.5 }, { time: "02:00", temperature: 3.3 },
  { time: "04:00", temperature: 3.8 }, { time: "06:00", temperature: 4.1 },
  { time: "08:00", temperature: 3.9 }, { time: "10:00", temperature: 4.4 },
  { time: "12:00", temperature: 4.2 }, { time: "14:00", temperature: 4.6 },
  { time: "15:00", temperature: 8.9 }, { time: "16:00", temperature: 5.1 },
  { time: "18:00", temperature: 4.3 }, { time: "20:00", temperature: 3.9 },
  { time: "22:00", temperature: 3.6 }, { time: "Now", temperature: 3.8 },
];

export const alerts = [
  { id: "alt-104", time: "Today, 15:08 UTC", deviceId: "truck-14", device: "Truck-14", severity: "Alert", detail: "Temperature exceeded 8°C for 11 minutes", batchId: "BAT-2026-0926-B" },
  { id: "alt-103", time: "Today, 12:41 UTC", deviceId: "cold-room-02", device: "Cold Room 02", severity: "Warning", detail: "Humidity remained above 70% for 24 minutes", batchId: "BAT-2026-0927-A" },
  { id: "alt-102", time: "Yesterday, 19:22 UTC", deviceId: "truck-22", device: "Truck-22", severity: "Alert", detail: "Temperature exceeded 8°C during transit", batchId: "BAT-2026-0926-C" },
  { id: "alt-101", time: "Sep 25, 06:13 UTC", deviceId: "warehouse-a-rack-3", device: "Warehouse-A Rack 3", severity: "Resolved", detail: "Device signal interrupted for 14 minutes", batchId: "BAT-2026-0926-B" },
];

export const getDevice = (id: string): Device => devices.find((device) => device.id === id) ?? { id: "unknown", name: "Unknown device", location: "Not registered", lastSeen: "Unavailable", temperature: 0, humidity: 0, status: "Alert", battery: 0, serial: "UNREGISTERED" };
export const shortHash = (hash: string) => `${hash.slice(0, 8)}...${hash.slice(-4)}`;
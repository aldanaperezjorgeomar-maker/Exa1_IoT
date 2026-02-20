const API_URL = "https://YOUR_MOCKAPI_URL/devices";
let logs = [];

/* =======================
   DASHBOARD / MONITOREO
======================= */

async function loadDashboard() {
  if (!document.getElementById("deviceCards")) return;

  const res = await fetch(API_URL);
  const devices = await res.json();

  const container = document.getElementById("deviceCards");
  container.innerHTML = "";

  devices.forEach(d => {
    container.innerHTML += `
      <div class="col-md-4 mb-3">
        <div class="card shadow">
          <div class="card-body">
            <h5>${d.nombre}</h5>
            <p>${d.descripcion}</p>
            <p><b>Ubicación:</b> ${d.ubicacion}</p>

            <div class="form-check form-switch">
              <input class="form-check-input"
                type="checkbox"
                ${d.estado ? "checked" : ""}
                onchange="toggleDevice('${d.id}', ${!d.estado})">
              <label class="form-check-label">
                ${d.estado ? "Encendido" : "Apagado"}
              </label>
            </div>

            ${extraInfo(d)}
          </div>
        </div>
      </div>
    `;
  });

  updateLogs(devices);
}

function extraInfo(d) {
  if (d.tipo === "Agua")
    return `<p>💧 Nivel: ${d.nivelAgua}%</p>`;
  if (d.tipo === "Riego")
    return `<p>🌱 Humedad: ${d.humedad}%</p>`;
  if (d.tipo === "Iluminación")
    return `<p>💡 Intensidad: ${d.intensidad}%</p>`;
  return "";
}

async function toggleDevice(id, state) {
  await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      estado: state,
      ultimoCambio: new Date().toISOString()
    })
  });
}

/* =======================
   LOGS
======================= */

function updateLogs(devices) {
  logs = devices
    .sort((a, b) => new Date(b.ultimoCambio) - new Date(a.ultimoCambio))
    .slice(0, 10);

  const table = document.getElementById("logTable");
  table.innerHTML = "";

  logs.forEach(d => {
    table.innerHTML += `
      <tr>
        <td>${d.nombre}</td>
        <td>${d.estado ? "ON" : "OFF"}</td>
        <td>${d.ubicacion}</td>
        <td>${new Date(d.ultimoCambio).toLocaleString()}</td>
      </tr>
    `;
  });
}

/* =======================
   ADMINISTRACIÓN (CRUD)
======================= */

async function loadAdmin() {
  if (!document.getElementById("adminTable")) return;

  const res = await fetch(API_URL);
  const devices = await res.json();

  const table = document.getElementById("adminTable");
  table.innerHTML = "";

  devices.forEach(d => {
    table.innerHTML += `
      <tr>
        <td>${d.nombre}</td>
        <td>${d.tipo}</td>
        <td>${d.ubicacion}</td>
        <td>
          <button class="btn btn-warning btn-sm" onclick='editDevice(${JSON.stringify(d)})'>Editar</button>
          <button class="btn btn-danger btn-sm" onclick='deleteDevice("${d.id}")'>Eliminar</button>
        </td>
      </tr>
    `;
  });
}

document.getElementById("deviceForm")?.addEventListener("submit", async e => {
  e.preventDefault();

  const device = {
    nombre: nombre.value,
    tipo: tipo.value,
    ubicacion: ubicacion.value,
    descripcion: descripcion.value,
    estado: false,
    ultimoCambio: new Date().toISOString(),
    activo: true
  };

  await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(device)
  });

  e.target.reset();
  loadAdmin();
});

async function deleteDevice(id) {
  await fetch(`${API_URL}/${id}`, { method: "DELETE" });
  loadAdmin();
}

/* =======================
   REFRESCO AUTOMÁTICO
======================= */

setInterval(() => {
  loadDashboard();
  loadAdmin();
}, 2000);

loadDashboard();
loadAdmin();
/* ============================
   GRÁFICA
============================ */

let chart;

function renderChart() {
  const ctx = document.getElementById("deviceChart");

  const labels = devices.map(d => d.nombre);
  const data = devices.map(d => d.estado ? 1 : 0);

  if (chart) {
    chart.destroy();
  }

  chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: "Estado (1 = ON, 0 = OFF)",
        data: data
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          max: 1
        }
      }
    }
  });
}

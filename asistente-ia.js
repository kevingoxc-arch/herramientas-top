/* ============================================================
   ASISTENTE IA — HerramientasTOP
   Chat con IA real (Google Gemini) integrado en tu web.
   ------------------------------------------------------------
   PARA ACTIVARLO (5 minutos, gratis):
   1) Entra en aistudio.google.com -> "Obtener clave de API"
      (usa tu cuenta de Google).
   2) Crea una clave API (Gemini API).
   3) RECOMENDADO: en "Restricciones de clave" limita la clave
      a tu web (dominio https://kevingoxc-arch.github.io)
      para que nadie pueda usarla desde otra página.
   4) Pega la clave abajo en GEMINI_API_KEY.
   5) Sube el archivo (o pídeselo al asistente).
   ============================================================ */

(function(){
  "use strict";

  /* ---------------- CONFIGURACIÓN ---------------- */

  // Pega aquí tu clave de API de Google AI Studio (Gemini API).
  const GEMINI_API_KEY = "TU_CLAVE_GEMINI_API";

  // Modelo: gemini-3.6-flash (equilibrio) | gemini-3.5-flash-lite (más barato)
  // | gemini-2.5-flash (precio-rendimiento). Cambia si tu cuenta no lo tiene.
  const MODELO = "gemini-3.6-flash";

  const NOMBRE_ASISTENTE = "AsistenteTOP";

  // Catálogo estático (se usa fuera de la tienda). En la página de la
  // tienda el bot usa automáticamente el catálogo real (window.PRODUCTOS).
  const CATALOGO_ESTATICO = [
    { nombre: "Guía: Cómo ganar dinero online desde cero", precio: "9,90 €" },
    { nombre: "Plantilla de Plan de Negocio en Notion", precio: "14,90 €" },
    { nombre: "Pack: 50 plantillas para redes sociales (Canva)", precio: "19,90 €" },
    { nombre: "Checklist de lanzamiento para tu negocio digital", precio: "4,90 €" }
  ];

  // Herramientas afiliadas que la web recomienda (con comisión para el dueño).
  const HERRAMIENTAS = [
    "Hostinger (hosting) desde 2,99 €/mes",
    "Canva Pro (diseño) desde 12,99 €/mes",
    "NordVPN (seguridad) desde 3,19 €/mes",
    "Notion (productividad) gratis / desde 10 €/mes",
    "Semrush (SEO) prueba 14 días, desde 129 €/mes",
    "Fiverr (freelance) desde 5 €"
  ];

  const PROMPT_SISTEMA = [
    "Eres '" + NOMBRE_ASISTENTE + "', el asistente virtual de HerramientasTOP, una web en español que recomienda las mejores herramientas digitales para trabajar, crear y vender online, y vende recursos digitales (guías y plantillas) en su tienda.",
    "Normas de comportamiento:",
    "- Responde SIEMPRE en español, de forma breve, clara y útil (máximo 150 palabras, salvo que pidan más detalle).",
    "- Recomienda productos del catálogo cuando encaje con lo que piden: da nombre y precio.",
    "- Si preguntan cómo comprar: indica que vayan a la sección Tienda de la web, añadan productos al carrito y paguen con PayPal; la entrega es digital inmediata.",
    "- Puedes recomendar también las herramientas afiliadas de la web de forma honesta, aclarando que HerramientasTOP puede recibir una comisión sin coste extra para el cliente.",
    "- Si no sabes la respuesta, dilo con honestidad y sugiere escribir a contacto@tudominio.com.",
    "- NUNCA inventes precios ni productos que no estén en el catálogo que se te da.",
    "- No menciones que eres un modelo de lenguaje ni detalles técnicos internos.",
    "",
    "Catálogo de la tienda (precios en euros, IVA no incluido):",
    (typeof window !== "undefined" && window.PRODUCTOS && window.PRODUCTOS.length
      ? window.PRODUCTOS.map(function(p){ return "- " + p.nombre + ": " + p.precio.toFixed(2).replace(".", ",") + " €"; }).join("\n")
      : CATALOGO_ESTATICO.map(function(p){ return "- " + p.nombre + ": " + p.precio; }).join("\n")),
    "",
    "Herramientas afiliadas recomendadas:",
    HERRAMIENTAS.map(function(h){ return "- " + h; }).join("\n")
  ].join("\n");

  /* ---------------- ESTILOS ---------------- */
  const estilos = `
    .ia-boton{
      position:fixed;bottom:22px;right:22px;z-index:9999;width:60px;height:60px;
      border-radius:50%;border:none;cursor:pointer;
      background:linear-gradient(135deg,#4338ca,#22d3ee);
      box-shadow:0 8px 24px rgba(67,56,202,.4);
      display:flex;align-items:center;justify-content:center;
      transition:transform .15s ease;
    }
    .ia-boton:hover{transform:scale(1.08)}
    .ia-panel{
      position:fixed;bottom:94px;right:22px;z-index:9999;width:min(370px,calc(100vw - 40px));
      height:min(560px,calc(100vh - 130px));background:#fff;border-radius:18px;
      box-shadow:0 20px 60px rgba(15,23,42,.3);display:none;flex-direction:column;overflow:hidden;
      border:1px solid #e4e7f0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;
    }
    .ia-panel.abierto{display:flex}
    .ia-cab{
      background:linear-gradient(135deg,#4338ca,#5b5bd6);color:#fff;padding:14px 18px;
      display:flex;align-items:center;gap:12px;
    }
    .ia-cab .ia-avatar{
      width:38px;height:38px;border-radius:50%;background:rgba(255,255,255,.2);
      display:flex;align-items:center;justify-content:center;flex-shrink:0;
    }
    .ia-cab strong{display:block;font-size:.98rem}
    .ia-cab small{opacity:.85;font-size:.78rem}
    .ia-cab .ia-cerrar{margin-left:auto;background:none;border:none;color:#fff;font-size:1.4rem;cursor:pointer;line-height:1}
    .ia-msgs{flex-grow:1;overflow-y:auto;padding:16px;background:#f6f7fb;display:flex;flex-direction:column;gap:10px}
    .ia-msg{max-width:85%;padding:10px 14px;border-radius:14px;font-size:.9rem;line-height:1.5;white-space:pre-wrap;word-wrap:break-word}
    .ia-msg.usuario{align-self:flex-end;background:#5b5bd6;color:#fff;border-bottom-right-radius:4px}
    .ia-msg.bot{align-self:flex-start;background:#fff;border:1px solid #e4e7f0;border-bottom-left-radius:4px}
    .ia-msg.bot a{color:#4338ca;font-weight:600}
    .ia-chip{font-size:.8rem;color:#4338ca;background:#eef0ff;border:1px solid #d5d9ff;padding:4px 12px;border-radius:999px;cursor:pointer}
    .ia-chip:hover{background:#e0e3ff}
    .ia-chips{display:flex;gap:8px;flex-wrap:wrap;padding:0 16px 10px;background:#f6f7fb}
    .ia-input-row{display:flex;gap:8px;padding:12px 14px;border-top:1px solid #e4e7f0;background:#fff}
    .ia-input-row input{
      flex:1;border:1px solid #e4e7f0;border-radius:10px;padding:10px 14px;font-size:.92rem;outline:none;
      font-family:inherit;
    }
    .ia-input-row input:focus{border-color:#5b5bd6}
    .ia-input-row button{
      background:#5b5bd6;color:#fff;border:none;border-radius:10px;padding:0 18px;
      font-weight:700;cursor:pointer;font-size:.9rem;font-family:inherit;
    }
    .ia-input-row button:hover{background:#4338ca}
    .ia-input-row button:disabled{background:#cbd5e1;cursor:not-allowed}
    .ia-escribiendo{display:flex;gap:4px;padding:6px 2px}
    .ia-escribiendo span{width:7px;height:7px;border-radius:50%;background:#94a3b8;animation:ia-pulso 1s infinite}
    .ia-escribiendo span:nth-child(2){animation-delay:.15s}
    .ia-escribiendo span:nth-child(3){animation-delay:.3s}
    @keyframes ia-pulso{0%,100%{opacity:.3}50%{opacity:1}}
    .ia-aviso{
      background:#fffbeb;border:1px solid #fcd34d;border-radius:10px;padding:10px 14px;
      font-size:.82rem;color:#92400e;margin:0 14px 12px;
    }
  `;
  const hoja = document.createElement("style");
  hoja.textContent = estilos;
  document.head.appendChild(hoja);

  /* ---------------- HTML DEL WIDGET ---------------- */
  const boton = document.createElement("button");
  boton.className = "ia-boton";
  boton.setAttribute("aria-label", "Abrir asistente");
  boton.innerHTML = '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9z"/><path d="M19 14l.9 2.1 2.1.9-2.1.9L19 20l-.9-2.1-2.1-.9 2.1-.9z"/><path d="M5 15l.7 1.8L7.5 17.5l-1.8.7L5 20l-.7-1.8-1.8-.7 1.8-.7z"/></svg>';

  const panel = document.createElement("div");
  panel.className = "ia-panel";
  panel.innerHTML = `
    <div class="ia-cab">
      <div class="ia-avatar">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9z"/></svg>
      </div>
      <div>
        <strong>${NOMBRE_ASISTENTE}</strong>
        <small>Asistente IA · responde al instante</small>
      </div>
      <button class="ia-cerrar" aria-label="Cerrar asistente">&times;</button>
    </div>
    <div class="ia-msgs" id="ia-msgs"></div>
    <div class="ia-chips" id="ia-chips">
      <button class="ia-chip">¿Qué me recomiendas?</button>
      <button class="ia-chip">¿Cómo compro en la tienda?</button>
      <button class="ia-chip">Mejores ofertas</button>
    </div>
    <div class="ia-input-row">
      <input type="text" id="ia-input" placeholder="Escribe tu mensaje..." aria-label="Tu mensaje">
      <button id="ia-enviar">Enviar</button>
    </div>
  `;

  document.body.appendChild(boton);
  document.body.appendChild(panel);

  /* ---------------- LÓGICA ---------------- */
  const msgsEl = panel.querySelector("#ia-msgs");
  const chipsEl = panel.querySelector("#ia-chips");
  const inputEl = panel.querySelector("#ia-input");
  const enviarBtn = panel.querySelector("#ia-enviar");

  const historial = [];
  let activa = false;

  const API_ACTIVA = GEMINI_API_KEY && GEMINI_API_KEY !== "TU_CLAVE_GEMINI_API";

  function añadirMensaje(texto, quien){
    const div = document.createElement("div");
    div.className = "ia-msg " + quien;
    div.textContent = texto;
    msgsEl.appendChild(div);
    msgsEl.scrollTop = msgsEl.scrollHeight;
    return div;
  }

  function mostrarEscribiendo(){
    const div = document.createElement("div");
    div.className = "ia-msg bot";
    div.innerHTML = '<div class="ia-escribiendo"><span></span><span></span><span></span></div>';
    msgsEl.appendChild(div);
    msgsEl.scrollTop = msgsEl.scrollHeight;
    return div;
  }

  function abrir(){
    activa = true;
    panel.classList.add("abierto");
    if (msgsEl.children.length === 0){
      if (API_ACTIVA){
        añadirMensaje("¡Hola! Soy " + NOMBRE_ASISTENTE + ". Puedo recomendarte las mejores herramientas digitales, ayudarte a elegir un producto de la tienda o resolver tus dudas. ¿Qué necesitas?", "bot");
      } else {
        añadirMensaje("¡Hola! Soy " + NOMBRE_ASISTENTE + ". El chat aún está pendiente de activar (falta la clave de IA). En cuanto se configure, responderé aquí mismo.", "bot");
        const aviso = document.createElement("div");
        aviso.className = "ia-aviso";
        aviso.innerHTML = "<strong>IA pendiente de activar:</strong> pega tu clave de Gemini API en <code>asistente-ia.js</code> (constante GEMINI_API_KEY) y vuelve a subir el archivo. Son 5 minutos — guía en la conversación del asistente.";
        msgsEl.appendChild(aviso);
      }
    }
  }

  function cerrar(){ activa = false; panel.classList.remove("abierto"); }

  boton.addEventListener("click", abrir);
  panel.querySelector(".ia-cerrar").addEventListener("click", cerrar);

  async function enviar(){
    const texto = inputEl.value.trim();
    if (!texto) return;
    inputEl.value = "";
    añadirMensaje(texto, "usuario");
    chipsEl.style.display = "none";

    if (!API_ACTIVA){
      añadirMensaje("Aún no puedo responder con IA: falta activar la clave API. Mientras tanto, puedes explorar la tienda y las guías desde el menú. Si necesitas ayuda, escríbeme a contacto@tudominio.com.", "bot");
      return;
    }

    historial.push({ role: "user", parts: [{ text: texto }] });
    const escribiendo = mostrarEscribiendo();
    enviarBtn.disabled = true;

    try{
      const respuesta = await llamarGemini();
      escribiendo.remove();
      const textoResp = respuesta.trim() || "Perdona, no he podido responder. Inténtalo de otra manera.";
      añadirMensaje(textoResp, "bot");
      historial.push({ role: "model", parts: [{ text: textoResp }] });
      if (historial.length > 20) historial.splice(0, historial.length - 20);
    }catch(err){
      escribiendo.remove();
      añadirMensaje("Ups, ha habido un problema con la conexión (" + (err.message || "error") + "). Inténtalo de nuevo en unos segundos.", "bot");
    }finally{
      enviarBtn.disabled = false;
      inputEl.focus();
    }
  }

  async function llamarGemini(){
    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/" + MODELO + ":generateContent?key=" + encodeURIComponent(GEMINI_API_KEY),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: PROMPT_SISTEMA }] },
          contents: historial,
          generationConfig: { temperature: 0.7, maxOutputTokens: 700 }
        })
      }
    );
    if (!res.ok){
      let detalle = "HTTP " + res.status;
      try{
        const err = await res.json();
        detalle = err.error?.message || detalle;
      }catch(e){}
      throw new Error(detalle);
    }
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  }

  enviarBtn.addEventListener("click", enviar);
  inputEl.addEventListener("keydown", function(e){ if (e.key === "Enter") enviar(); });

  panel.querySelectorAll(".ia-chip").forEach(function(chip){
    chip.addEventListener("click", function(){
      inputEl.value = chip.textContent;
      enviar();
    });
  });
})();

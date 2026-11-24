"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const main = document.querySelector("main");
    if (!main) return;

    // Traducciones: Django las inyecta en /<idioma>/jsi18n/. Si no cargaran, se usa el texto original.
    const gettext = window.gettext || ((texto) => texto);
    const interpolate = window.interpolate || ((fmt, obj) => fmt.replace(/%\(\w+\)s/g, (m) => obj[m.slice(2, -2)]));

    // Caché en memoria para no repetir peticiones fetch de páginas ya visitadas
    const cachePaginas = new Map();

    // Resaltar en el menú superior la sección actual
    const marcarMenuActivo = () => {
        const rutaActual = window.location.pathname;
        const raizIdioma = `/${document.documentElement.lang}/`;
        document.querySelectorAll("nav a").forEach((enlace) => {
            const rutaEnlace = new URL(enlace.href).pathname;
            const activo = rutaEnlace === raizIdioma
                ? rutaActual === raizIdioma
                : rutaActual.startsWith(rutaEnlace);
            enlace.classList.toggle("activo", activo);
        });
    };

    // Reiniciar animación suave en la zona blanca central (<main>)
    const animarMain = () => {
        main.classList.remove("fade-in");
        void main.offsetWidth; // Fuerza reflujo para reiniciar la animación CSS
        main.classList.add("fade-in");
    };

    // Registrar si el usuario navega desde dentro de la web
    const registrarOrigenInterno = () => {
        const esDetallePodcast = /^\/[a-z]{2}(?:-[a-z]+)?\/podcasts\/\d+\/?$/i.test(window.location.pathname);
        if (!esDetallePodcast || (document.referrer && document.referrer.includes(window.location.host))) {
            sessionStorage.setItem("navegacionInterna", "1");
        }
    };

    // Inicializar eventos de los elementos que viven dentro de <main>
    const inicializarContenidoMain = () => {
        registrarOrigenInterno();
        marcarMenuActivo();

        // 1. Botones "Volver" inteligentes
        document.querySelectorAll(".js-volver").forEach((enlace) => {
            enlace.addEventListener("click", (event) => {
                const tieneOrigenInterno = sessionStorage.getItem("navegacionInterna") === "1";
                if (window.history.length > 1 && tieneOrigenInterno) {
                    event.preventDefault();
                    window.history.back();
                }
            });
        });

        // 2. Buscador instantáneo con resaltado en negrita
        const buscador = document.getElementById("buscador-podcasts");
        const listaPodcasts = document.getElementById("lista-podcasts");

        const resaltarCoincidencia = (elemento, termino) => {
            const textoOriginal = elemento.textContent;
            if (!termino) {
                elemento.textContent = textoOriginal;
                return;
            }

            const terminoEscapado = termino.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const regex = new RegExp(`(${terminoEscapado})`, "gi");
            const partes = textoOriginal.split(regex);

            elemento.textContent = "";
            partes.forEach((parte) => {
                if (parte.toLowerCase() === termino.toLowerCase()) {
                    const negrita = document.createElement("strong");
                    negrita.className = "resaltado-busqueda";
                    negrita.textContent = parte;
                    elemento.append(negrita);
                } else if (parte) {
                    elemento.append(document.createTextNode(parte));
                }
            });
        };

        if (buscador && listaPodcasts) {
            const items = listaPodcasts.querySelectorAll("li");
            const contador = document.getElementById("contador-podcasts");
            const sinResultados = document.getElementById("sin-resultados");

            buscador.addEventListener("input", () => {
                const termino = buscador.value.trim();
                const terminoMinusculas = termino.toLowerCase();
                let visibles = 0;

                items.forEach((item) => {
                    const texto = item.textContent.toLowerCase();
                    const coincide = texto.includes(terminoMinusculas);
                    item.classList.toggle("oculto", !coincide);

                    if (coincide) {
                        visibles++;
                        item.querySelectorAll("a").forEach((enlace) => {
                            resaltarCoincidencia(enlace, termino);
                        });
                    }
                });

                if (contador) {
                    contador.textContent = interpolate(
                        gettext("Mostrando %(visibles)s de %(total)s"),
                        { visibles: visibles, total: items.length },
                        true
                    );
                }
                if (sinResultados) {
                    sinResultados.classList.toggle("oculto", visibles > 0);
                }
            });
        }

        // 3. Publicación de comentarios con AJAX (Fetch + JSON)
        const formComentario = document.getElementById("form-comentario");
        if (formComentario) {
            const btnPublicar = document.getElementById("btn-publicar");
            const mensajeAjax = document.getElementById("mensaje-ajax");
            const listaComentarios = document.getElementById("lista-comentarios");
            const totalComentarios = document.getElementById("total-comentarios");
            const sinComentarios = document.getElementById("sin-comentarios");

            const mostrarMensaje = (texto, tipo) => {
                mensajeAjax.textContent = texto;
                mensajeAjax.className = `mensaje-ajax ${tipo}`;
            };

            formComentario.addEventListener("submit", (event) => {
                event.preventDefault();

                const formData = new FormData(formComentario);
                const textoBoton = btnPublicar.textContent;
                btnPublicar.disabled = true;
                btnPublicar.textContent = gettext("Publicando...");

                fetch(window.location.href, {
                    method: "POST",
                    body: formData,
                    headers: {
                        "X-Requested-With": "XMLHttpRequest",
                        "X-CSRFToken": formData.get("csrfmiddlewaretoken")
                    }
                })
                    .then((response) => {
                        if (!response.ok) {
                            return Promise.reject(gettext("Revisa los campos del formulario."));
                        }
                        return response.json();
                    })
                    .then((data) => {
                        const articulo = document.createElement("article");
                        articulo.className = "comentario-item comentario-nuevo";

                        const cabecera = document.createElement("div");
                        cabecera.className = "comentario-cabecera";

                        const autorStrong = document.createElement("strong");
                        autorStrong.textContent = data.autor;

                        const etiquetaSpan = document.createElement("span");
                        etiquetaSpan.className = "etiqueta";
                        etiquetaSpan.textContent = data.valoracion;

                        const fechaSpan = document.createElement("span");
                        fechaSpan.className = "comentario-fecha";
                        fechaSpan.textContent = data.fecha;

                        const parrafo = document.createElement("p");
                        parrafo.textContent = data.texto;

                        cabecera.append(autorStrong, etiquetaSpan, fechaSpan);
                        articulo.append(cabecera, parrafo);
                        listaComentarios.prepend(articulo);

                        if (sinComentarios) {
                            sinComentarios.classList.add("oculto");
                        }
                        if (totalComentarios) {
                            totalComentarios.textContent = data.total;
                        }

                        // Invalidar caché de este podcast para que conserve el nuevo comentario
                        cachePaginas.delete(window.location.href);

                        formComentario.reset();
                        mostrarMensaje(gettext("¡Comentario publicado correctamente!"), "exito");
                    })
                    .catch((error) => {
                        mostrarMensaje(interpolate(gettext("Error al publicar: %(error)s"), { error: error }, true), "error");
                    })
                    .finally(() => {
                        btnPublicar.disabled = false;
                        btnPublicar.textContent = textoBoton;
                    });
            });
        }
    };

    // 4. NAVEGACIÓN PARCIAL: ACTUALIZAR SOLO LA ZONA BLANCA (<main>) + CACHÉ + HISTORY API
    const cargarSoloMain = (url, { modoHistorial = "push" } = {}) => {
        const aplicarVista = ({ titulo, htmlMain }) => {
            document.title = titulo;
            main.innerHTML = htmlMain;
            main.classList.remove("cargando-main");

            if (modoHistorial === "push") {
                window.history.pushState({ url }, "", url);
            } else if (modoHistorial === "replace") {
                window.history.replaceState({ url }, "", url);
            }

            window.scrollTo({ top: 0, behavior: "smooth" });
            animarMain();
            inicializarContenidoMain();
        };

        // Si ya está en caché, renderizar al instante sin petición de red
        if (cachePaginas.has(url)) {
            aplicarVista(cachePaginas.get(url));
            return;
        }

        main.classList.add("cargando-main");

        fetch(url, {
            headers: { "X-Requested-With": "XMLHttpRequest" }
        })
            .then((response) => {
                if (!response.ok) {
                    return Promise.reject(`HTTP ${response.status}`);
                }
                return response.text();
            })
            .then((htmlCompleto) => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(htmlCompleto, "text/html");
                const nuevoMain = doc.querySelector("main");

                if (!nuevoMain) {
                    window.location.href = url;
                    return;
                }

                const datosVista = {
                    titulo: doc.title,
                    htmlMain: nuevoMain.innerHTML
                };
                cachePaginas.set(url, datosVista);
                aplicarVista(datosVista);
            })
            .catch(() => {
                // Respaldo: navegación clásica si falla la red
                window.location.href = url;
            });
    };

    // Delegación global de clics en enlaces internos (mantiene <header>, <nav> y <footer> fijos)
    document.addEventListener("click", (event) => {
        if (event.defaultPrevented || event.button !== 0) return;
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

        const enlace = event.target.closest("a[href]");
        if (!enlace) return;

        // Ignorar enlaces externos, panel admin o botones "Volver" (gestionados por history.back)
        if (enlace.target === "_blank" || enlace.classList.contains("js-volver")) return;
        const urlDestino = new URL(enlace.href, window.location.origin);
        if (urlDestino.origin !== window.location.origin) return;
        if (urlDestino.pathname.startsWith("/admin")) return;

        event.preventDefault();

        // En Anterior/Siguiente usamos replaceState para no apilar historial al pulsar "Volver"
        const esPaginacionDetalle = enlace.id === "btn-anterior" || enlace.id === "btn-siguiente";
        cargarSoloMain(urlDestino.href, {
            modoHistorial: esPaginacionDetalle ? "replace" : "push"
        });
    });

    // Soportar botones Atrás / Adelante del navegador cargando solo <main>
    window.addEventListener("popstate", () => {
        cargarSoloMain(window.location.href, { modoHistorial: "none" });
    });

    // Atajos de teclado (flechas izquierda/derecha) usando navegación parcial
    document.addEventListener("keydown", (event) => {
        const etiquetaActiva = document.activeElement.tagName;
        if (["INPUT", "TEXTAREA", "SELECT"].includes(etiquetaActiva)) return;

        const btnAnterior = document.getElementById("btn-anterior");
        const btnSiguiente = document.getElementById("btn-siguiente");

        if (event.key === "ArrowLeft" && btnAnterior) {
            cargarSoloMain(btnAnterior.href, { modoHistorial: "replace" });
        } else if (event.key === "ArrowRight" && btnSiguiente) {
            cargarSoloMain(btnSiguiente.href, { modoHistorial: "replace" });
        }
    });

    // Selector de idioma (vive fuera de <main>): al enviarlo, volver a la página actual
    const formIdioma = document.querySelector(".selector-idioma");
    if (formIdioma) {
        formIdioma.addEventListener("submit", () => {
            const campoNext = formIdioma.querySelector('input[name="next"]');
            if (campoNext) {
                campoNext.value = window.location.pathname + window.location.search;
            }
        });
    }

    // Botón flotante "Subir arriba"
    const btnSubir = document.getElementById("btn-subir");
    if (btnSubir) {
        window.addEventListener("scroll", () => {
            btnSubir.classList.toggle("visible", window.scrollY > 200);
        });

        btnSubir.addEventListener("click", () => {
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }

    // Guardar la primera página cargada en caché e inicializar eventos
    cachePaginas.set(window.location.href, {
        titulo: document.title,
        htmlMain: main.innerHTML
    });
    animarMain();
    inicializarContenidoMain();
});
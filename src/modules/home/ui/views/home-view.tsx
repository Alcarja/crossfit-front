/* eslint-disable @next/next/no-img-element */
"use client";

import {
  Calendar,
  Users,
  ArrowRight,
  FileText,
  DollarSign,
  LayoutDashboard,
  ClipboardList,
  ChevronDown,
  CheckCircle2,
  BarChart3,
  Shield,
} from "lucide-react";
import Link from "next/link";

export default function HomeView() {
  return (
    <main className="bg-stone-50 text-stone-900 min-h-screen -mt-[calc(4rem+1.5px)]">
      {/* ──────────── HERO ──────────── */}
      <section className="relative min-h-[90vh] flex flex-col justify-center px-6 md:px-12 lg:px-20 overflow-hidden">
        {/* Soft gradient blobs */}
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-red-100/60 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-stone-200/80 blur-[100px] pointer-events-none" />

        <div className="relative z-10 max-w-6xl w-full mx-auto">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white border border-stone-200 rounded-full px-4 py-1.5 text-xs text-stone-500 mb-8 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
              Software de gesti&oacute;n para boxes
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[0.95] tracking-tight text-stone-900">
              Gestiona tu box,
              <br />
              <span className="text-red-500">sin complicaciones.</span>
            </h1>

            <p className="mt-6 text-stone-500 text-base sm:text-lg max-w-lg leading-relaxed">
              Clases, coaches, programaci&oacute;n, gastos y horarios — todo
              desde una sola plataforma pensada para boxes de cross training.
            </p>

            <div className="flex flex-col sm:flex-row items-start gap-4 mt-8">
              <Link href="/login">
                <button className="h-12 px-8 text-sm font-semibold bg-stone-900 hover:bg-stone-800 text-white rounded-xl transition-colors flex items-center gap-2 cursor-pointer shadow-sm">
                  Empezar gratis
                  <ArrowRight className="size-4" />
                </button>
              </Link>
              <a
                href="#funcionalidades"
                className="h-12 px-6 text-sm font-medium text-stone-400 hover:text-stone-600 transition-colors flex items-center gap-2"
              >
                Ver funcionalidades
                <ChevronDown className="size-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-stone-300">
          <ChevronDown className="size-5 animate-bounce" />
        </div>
      </section>

      {/* ──────────── FUNCIONALIDADES ──────────── */}
      <section
        id="funcionalidades"
        className="border-t border-stone-200 scroll-mt-20"
      >
        <div className="max-w-6xl mx-auto px-6 md:px-12 lg:px-20 py-24">
          <div className="mb-14">
            <p className="text-xs uppercase tracking-[0.25em] text-red-500 font-semibold mb-3">
              Funcionalidades
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Todo lo que necesitas para tu box.
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: <Calendar className="size-5" />,
                title: "Horarios y calendario",
                desc: "Configura clases, franjas horarias y plazas. Tus atletas reservan directamente desde la app.",
              },
              {
                icon: <Users className="size-5" />,
                title: "Gesti\u00f3n de coaches",
                desc: "Asigna coaches a clases, controla sus horas y gestiona turnos de forma sencilla.",
              },
              {
                icon: <ClipboardList className="size-5" />,
                title: "Programaci\u00f3n / WODs",
                desc: "Sube la programaci\u00f3n diaria o semanal. Los coaches y atletas la consultan al instante.",
              },
              {
                icon: <DollarSign className="size-5" />,
                title: "Control de gastos",
                desc: "Registra gastos del box por categor\u00eda, coach o fecha. Visualiza d\u00f3nde va tu dinero.",
              },
              {
                icon: <BarChart3 className="size-5" />,
                title: "Panel de administraci\u00f3n",
                desc: "Vista general de tu box: clases del d\u00eda, coaches activos, gastos y m\u00e1s — en un solo vistazo.",
              },
              {
                icon: <Shield className="size-5" />,
                title: "Roles y permisos",
                desc: "Diferencia entre admin, coach y atleta. Cada perfil ve solo lo que le corresponde.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="group bg-white border border-stone-200 rounded-2xl p-7 hover:border-stone-300 hover:shadow-md transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-500 mb-5 group-hover:bg-red-50 group-hover:text-red-500 transition-colors">
                  {item.icon}
                </div>
                <h3 className="font-bold text-sm mb-2">{item.title}</h3>
                <p className="text-xs text-stone-400 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────── CÓMO FUNCIONA ──────────── */}
      <section className="border-t border-stone-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 md:px-12 lg:px-20 py-24">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-red-500 font-semibold mb-3">
                Simple
              </p>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-[1.1]">
                Configurado
                <br />
                en minutos.
              </h2>
              <p className="mt-6 text-sm text-stone-400 leading-relaxed max-w-sm">
                No necesitas formaci&oacute;n ni soporte t&eacute;cnico. Crea tu
                cuenta, a&ntilde;ade tus coaches y empieza a gestionar tu box
                desde el primer d&iacute;a.
              </p>
            </div>

            <div className="space-y-4">
              {[
                {
                  num: "01",
                  title: "Crea tu cuenta",
                  desc: "Reg\u00edstrate y configura tu box en menos de 2 minutos.",
                },
                {
                  num: "02",
                  title: "A\u00f1ade coaches y horarios",
                  desc: "Define las clases, asigna coaches y establece las plazas disponibles.",
                },
                {
                  num: "03",
                  title: "Sube la programaci\u00f3n",
                  desc: "Publica los WODs y que tus atletas lleguen al box sabiendo qu\u00e9 toca.",
                },
                {
                  num: "04",
                  title: "Controla todo desde el panel",
                  desc: "Gastos, asistencia, horarios — todo centralizado y accesible.",
                },
              ].map((step) => (
                <div
                  key={step.num}
                  className="flex items-start gap-5 p-5 rounded-2xl border border-stone-100 hover:border-stone-200 transition-colors group"
                >
                  <span className="text-xl font-extrabold text-stone-200 group-hover:text-red-300 transition-colors shrink-0 w-8">
                    {step.num}
                  </span>
                  <div>
                    <h3 className="font-bold text-sm mb-1">{step.title}</h3>
                    <p className="text-xs text-stone-400 leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ──────────── PREVIEW / BENTO ──────────── */}
      <section className="border-t border-stone-200">
        <div className="max-w-6xl mx-auto px-6 md:px-12 lg:px-20 py-24">
          <div className="mb-14">
            <p className="text-xs uppercase tracking-[0.25em] text-red-500 font-semibold mb-3">
              Plataforma
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Dise&ntilde;ada para el d&iacute;a a d&iacute;a de tu box.
            </h2>
          </div>

          <div className="grid lg:grid-cols-3 gap-5">
            {/* Large card — Calendar */}
            <div className="lg:col-span-2 lg:row-span-2 bg-white border border-stone-200 rounded-2xl p-8 md:p-10 flex flex-col justify-between min-h-[360px]">
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <LayoutDashboard className="size-4 text-red-400" />
                  <span className="text-xs uppercase tracking-[0.2em] text-stone-400 font-medium">
                    Calendario
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight mb-3">
                  Vista semanal con todas las clases
                </h3>
                <p className="text-sm text-stone-400 leading-relaxed max-w-md">
                  Visualiza de un vistazo las clases programadas, los coaches
                  asignados y las plazas disponibles. Arrastra y suelta para
                  reorganizar.
                </p>
              </div>
              {/* Mock schedule */}
              <div className="mt-8 grid grid-cols-5 gap-2">
                {["Lun", "Mar", "Mi\u00e9", "Jue", "Vie"].map((day) => (
                  <div key={day} className="space-y-2">
                    <p className="text-[10px] uppercase tracking-wider text-stone-300 text-center font-medium">
                      {day}
                    </p>
                    <div className="bg-stone-50 border border-stone-100 rounded-lg p-2 text-center">
                      <p className="text-[10px] font-bold text-stone-500">
                        09:00
                      </p>
                      <p className="text-[9px] text-stone-300">WOD</p>
                    </div>
                    <div className="bg-red-50 border border-red-100 rounded-lg p-2 text-center">
                      <p className="text-[10px] font-bold text-red-400">
                        10:00
                      </p>
                      <p className="text-[9px] text-red-300">WOD</p>
                    </div>
                    <div className="bg-stone-50 border border-stone-100 rounded-lg p-2 text-center">
                      <p className="text-[10px] font-bold text-stone-500">
                        14:00
                      </p>
                      <p className="text-[9px] text-stone-300">WOD</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Small card — Programming */}
            <div className="bg-white border border-stone-200 rounded-2xl p-7 flex flex-col justify-between">
              <FileText className="size-5 text-stone-300" />
              <div className="mt-5">
                <h3 className="font-bold text-sm mb-2">Programaci&oacute;n</h3>
                <p className="text-xs text-stone-400 leading-relaxed">
                  Publica WODs con editor enriquecido. Im&aacute;genes,
                  v&iacute;deos y formato — todo incluido.
                </p>
              </div>
            </div>

            {/* Small card — Expenses */}
            <div className="bg-white border border-stone-200 rounded-2xl p-7 flex flex-col justify-between">
              <DollarSign className="size-5 text-stone-300" />
              <div className="mt-5">
                <h3 className="font-bold text-sm mb-2">Gastos</h3>
                <p className="text-xs text-stone-400 leading-relaxed">
                  Filtra por coach, categor&iacute;a o mes. Exporta a Excel con
                  un clic.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────── BENEFICIOS ──────────── */}
      <section className="border-t border-stone-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 md:px-12 lg:px-20 py-24">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-red-500 font-semibold mb-3">
                Ventajas
              </p>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-[1.1]">
                Menos Excel.
                <br />
                M&aacute;s box.
              </h2>
              <p className="mt-6 text-sm text-stone-400 leading-relaxed max-w-sm">
                Deja de gestionar tu box con hojas de c&aacute;lculo, grupos de
                WhatsApp y notas sueltas. Centraliza todo y ded&iacute;cate a lo
                importante.
              </p>
            </div>

            <div className="space-y-4">
              {[
                "Toda la gesti\u00f3n del box en un solo sitio",
                "Los coaches ven sus clases y horarios al instante",
                "Programaci\u00f3n visible para todo el equipo",
                "Control de gastos claro y exportable",
                "Funciona en m\u00f3vil, tablet y escritorio",
                "Sin curva de aprendizaje — simple desde el d\u00eda 1",
              ].map((benefit) => (
                <div
                  key={benefit}
                  className="flex items-center gap-3 py-3 px-4 rounded-xl border border-stone-100"
                >
                  <CheckCircle2 className="size-4 text-red-400 shrink-0" />
                  <span className="text-sm text-stone-600">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ──────────── CTA ──────────── */}
      <section className="border-t border-stone-200">
        <div className="max-w-6xl mx-auto px-6 md:px-12 lg:px-20 py-28">
          <div className="bg-stone-900 rounded-3xl p-12 md:p-16 text-center relative overflow-hidden">
            {/* Subtle glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[200px] rounded-full bg-red-500/10 blur-[80px] pointer-events-none" />

            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white">
                Empieza a gestionar
                <br />
                <span className="text-red-400">tu box hoy.</span>
              </h2>
              <p className="mt-4 text-white/40 max-w-md mx-auto text-sm">
                Gratis para empezar. Sin tarjeta, sin compromiso.
              </p>
              <div className="mt-10">
                <Link href="/login">
                  <button className="h-14 px-10 text-sm font-semibold bg-white hover:bg-stone-100 text-stone-900 rounded-xl transition-colors flex items-center gap-2 mx-auto cursor-pointer shadow-sm">
                    Crear cuenta gratis
                    <ArrowRight className="size-4" />
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────── FOOTER ──────────── */}
      <footer className="border-t border-stone-200">
        <div className="max-w-6xl mx-auto px-6 md:px-12 lg:px-20 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Logo" className="w-8 h-8" />
            <span className="text-xs text-stone-400">
              &copy; {new Date().getFullYear()} Todos los derechos reservados.
            </span>
          </div>
          <div className="flex gap-6 text-xs text-stone-400">
            <a
              href="#funcionalidades"
              className="hover:text-stone-600 transition-colors"
            >
              Funcionalidades
            </a>
            <Link
              href="/login"
              className="hover:text-stone-600 transition-colors"
            >
              Acceder
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

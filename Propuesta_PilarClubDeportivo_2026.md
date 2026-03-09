# PILAR GOLF CLUB

## Sistema de Gestión de Membresías y Reservas

> Una plataforma diseñada para maximizar ingresos, optimizar la ocupación del campo y digitalizar completamente la operación del golf.

---

## 📌 Resumen del Sistema

| Módulo     | Función                                     |
| ---------- | ------------------------------------------- |
| Membresías | Acceso al club y beneficios para socios     |
| Reservas   | Booking online en tiempo real               |
| Precios    | Tarifa fija para socios / Dinámica para el resto |
| Pagos      | Integración múltiple                        |
| Servicios  | Servicios adicionales por reserva           |
| Ausencias  | Control automático                          |
| Reportes   | Información operativa                       |

---

### 1. Resumen Ejecutivo

El sistema propuesto es una plataforma de gestión diseñada exclusivamente para la operación del área de golf del club.

Permite administrar socios, membresías, reservas de tee times y cobros, con un modelo diferenciado de precios:

**El socio con membresía de golf accede al club y puede reservar un tee time a una tarifa preferencial fija. El socio sin membresía paga una tarifa calculada dinámicamente según el motor de revenue management.**

El sistema centraliza toda la operación del golf en una única plataforma, optimizando ingresos, ocupación y control administrativo.

---

### 2. Beneficios 📈

| Beneficio                 | Impacto                                                         |
| ------------------------- | --------------------------------------------------------------- |
| 💰 Ingresos Predecibles   | Membresías mensuales con recurrencia garantizada                |
| 📈 Mayor Ocupación        | Sistema de reservas online y precios dinámicos para no socios   |
| ⚙️ Operación Simplificada | Cobro directo, sin gestión de créditos ni saldos intermedios    |
| 🚫 Menos Ausencias        | Sistema automático de sanciones y límite mensual de reservas    |
| 📊 Decisiones con Datos   | Reportes claros y centralizados                                 |

---

### 3. Concepto Central: Membresía como Beneficio de Acceso 🏌️

#### Funcionamiento

* El socio paga su membresía mensual
* La membresía habilita el acceso al club y otorga beneficios, entre ellos:
  * Reservar tee times a una **tarifa preferencial fija de $3.000**
  * Límite de reservas mensuales incluido en el plan
* El socio **sin membresía** puede igualmente reservar turnos, pero el precio se calcula dinámicamente mediante el motor de revenue management

#### Beneficios para el Club

* Ingresos recurrentes por membresías
* Diferenciación de valor para el socio
* Mayor control de la ocupación del campo
* Motor de precios activo para capturar demanda de no socios

---

### 4. Objetivo del Sistema 🎯

El objetivo es digitalizar y optimizar la gestión del golf mediante un sistema que permita:

* Administración completa de socios
* Gestión de membresías mensuales
* Control y disponibilidad de tee times
* Reservas online en tiempo real con servicios adicionales
* Tarifa preferencial fija para socios con membresía
* Precios dinámicos para socios sin membresía
* Integración de múltiples formas de pago
* Control de ausencias, sanciones y límite mensual de reservas
* Generación de reportes operativos y financieros
* Posibilidad de integrarse a futuro con un sistema superior que administre diferentes áreas

El sistema busca reducir procesos manuales, mejorar la experiencia del socio y aumentar la eficiencia operativa del club.

---

### 5. Tipos de Socios 👤

#### Socio con Membresía Golf

Cuenta con una suscripción mensual activa que le otorga acceso al club y beneficios preferenciales. Su reserva de tee time tiene una **tarifa fija de $3.000**, independientemente del horario o demanda. Sujeto a un máximo de reservas por mes establecido en su plan.

#### Socio sin Membresía

Puede reservar turnos sin necesidad de suscripción. El precio de su reserva se calcula automáticamente mediante el motor de revenue management, considerando horario, día, ocupación y otros factores configurables.

---

### 6. Billetera del Socio 💳

Cada socio dispone de una billetera virtual para futuros usos dentro del club.

> ⚠️ **Esta funcionalidad estará disponible en una etapa futura.** Por el momento, todos los cobros se realizan directamente mediante los medios de pago disponibles (MercadoPago, transferencia, efectivo).

#### Funcionalidades previstas (etapa futura)

* Recargas manuales desde el perfil del usuario
* Descuento automático al realizar reservas
* Visualización de saldo disponible en tiempo real
* Historial completo de movimientos

---
<br><br>
### 7. Sistema de Reservas 📅

Los socios pueden realizar reservas de manera online mediante un flujo simple y validado automáticamente.

#### Flujo de Reserva

1. **Verificación de estado del socio** — Se valida que el socio no tenga sanciones activas ni haya superado el límite mensual de reservas.
2. **Selección de fecha** — El socio elige el día deseado.
3. **Selección de horario** — Se muestra la disponibilidad de tee times en tiempo real.
4. **Cálculo del precio** — Si el socio tiene membresía activa, se aplica la tarifa preferencial fija de **$3.000**. Si no tiene membresía, el precio se calcula mediante el motor de revenue management.
5. **Servicios adicionales** — Se ofrece al socio agregar extras a la reserva: carrito, caddy, entre otros.
6. **Selección del medio de pago** — El socio elige entre los medios disponibles (MercadoPago, transferencia, efectivo).
7. **Confirmación de reserva** — El socio confirma la reserva, se procesa el pago y se bloquea el turno en el calendario.
8. **Confirmación y QR** — Se envía confirmación al socio y se genera un código QR para validar su ingreso al club.

#### Límite Mensual de Reservas

Cada plan de membresía define un cupo máximo de reservas por mes. El sistema controla este límite automáticamente y notifica al socio cuando se acerca al tope.

#### Servicios Adicionales

Al momento de la reserva, el socio puede incorporar servicios extras con costo adicional:

| Servicio | Descripción                           |
| -------- | ------------------------------------- |
| Carrito  | Alquiler de carrito eléctrico o a pie |
| Caddy    | Asistencia de caddy durante el juego  |
| Otros    | Servicios configurables por el club   |

---

### 8. Gestión de Tee Times ⛳

El sistema permite configurar completamente la disponibilidad del campo de golf.

#### Configuración

* Horarios de operación
* Intervalos entre salidas
* Capacidad por turno
* Días habilitados
* Cantidad de canchas

A partir de esta configuración, el sistema genera automáticamente los tee times disponibles, permitiendo una gestión ordenada y eficiente del campo.

---

### 9. Motor de Precios ⚙️

> 🧠 MOTOR DE REVENUE MANAGEMENT
> Aplica únicamente a socios **sin membresía**. Ajusta precios automáticamente según demanda para maximizar ingresos y ocupación.

El sistema incorpora un motor de cálculo de tarifas para socios sin membresía. El motor puede ser activado o desactivado desde el panel de administración.

**Los socios con membresía siempre pagan la tarifa preferencial fija de $3.000, independientemente de los factores del motor.**

El motor ajusta automáticamente los precios según:

* Horario
* Día
* Ocupación

![Diagrama de Precios Inteligente](https://i.postimg.cc/htzwMj2F/pilar-drawio.png)
<br><br><br><br>
#### Multiplicador por Horario

| Tipo de horario | Multiplicador | Descripción                      |
| --------------- | ------------- | -------------------------------- |
| Hora valle      | 0.75          | Baja demanda, incentiva reservas |
| Normal          | 1.00          | Precio base                      |
| Hora pico       | 1.25          | Alta demanda                     |

#### Multiplicador por Día

| Tipo de día   | Multiplicador | Descripción        |
| ------------- | ------------- | ------------------ |
| Entre semana  | 0.80          | Menor demanda      |
| Viernes       | 1.20          | Demanda media-alta |
| Fin de semana | 1.30          | Alta demanda       |
| Festivo       | 1.40          | Demanda máxima     |

#### Multiplicador por Demanda

| Nivel de ocupación | Multiplicador | Descripción                       |
| ------------------ | ------------- | --------------------------------- |
| 0% - 30%           | 0.70          | Baja ocupación, incentiva demanda |
| 31% - 60%          | 1.00          | Demanda estable                   |
| 61% - 80%          | 1.25          | Alta ocupación                    |
| 81% - 100%         | 1.50          | Muy alta demanda                  |

Pueden agregarse más factores

#### Fórmula de Cálculo (solo para socios sin membresía)


precioFinal = precioBase
precioFinal *= multiplicadorPorHorario
precioFinal *= multiplicadorPorDía
precioFinal *= multiplicadorPorDemanda
precioFinal = ajustarALímites(precioFinal, mínimoPermitido, máximoPermitido)
precioFinal = redondear(precioFinal)


#### Fórmula resumida

`
precioFinal = precioBase × M_horario × M_día × M_demanda
`

#### Ejemplo Ilustrativo

> **Nota:** Los valores mostrados a continuación son meramente ilustrativos.
> Todos los multiplicadores, umbrales y porcentajes son configurables por el administrador del club según la política comercial vigente.

| Paso | Concepto                                  | Valor (ejemplo) | Resultado |
| ---- | ----------------------------------------- | --------------- | --------- |
| 1    | Precio base del espacio                   | —               | $10.000   |
| 2    | Multiplicador por horario (horario pico)  | × 1,20          | $12.000   |
| 3    | Multiplicador por día (sábado)            | × 1,15          | $13.800   |
| 4    | Multiplicador por demanda (80% ocupación) | × 1,30          | $17.940   |
| 5    | Límites de seguridad (máximo +50%)        | Tope: $15.000   | $15.000   |
| 6    | Redondeo configurado (a $50)              | —               | $15.000   |

Permite maximizar ingresos y mejorar la ocupación de socios sin membresía.

---

### 10. Sistema de Pagos 💰

* Pagos Online a través de MercadoPago
* Transferencia
* Efectivo

> La billetera virtual estará disponible como medio de pago en una etapa futura.

---

### 11. Control de Ausencias 🚫

* Registro automático
* Acumulación de faltas
* Suspensión automática

---

### 12. Control de Acceso 📲

Validación mediante código QR para registrar ingreso.

---

### 13. Reportes 📊

* Ocupación
* Ingresos
* Membresías
* Ausencias
* Uso de servicios adicionales

---

### 14. Arquitectura 🏗️

> 🏗️ ARQUITECTURA ESCALABLE
> Diseñada para soportar crecimiento, integraciones y alta demanda operativa.

![stackt](https://i.postimg.cc/5yp0PpNz/Screenshot-2.png)

* Backend (lógica de negocio): Servidor de aplicaciones que procesa todas las operaciones: reservas, cálculo de precios, validación de membresías, control de sanciones, procesamiento de pagos, generación de códigos QR y generación de reportes

* Frontend (interfaz de usuario): Aplicación web responsive accesible desde cualquier navegador (celular, tablet, computadora). Incluye: panel de administración, portal del socio, gestión de espacios, membresías, billetera del socio y panel de configuración

* Base de datos: Base de datos PostgreSQL con almacenamiento seguro de toda la información: socios, reservas, pagos, configuraciones, historial de sanciones. Incluye cache en memoria y transacciones atómicas para integridad de datos

Diseñado para:

* Escalabilidad
* Seguridad
* Integraciones futuras

---
<br><br><br>
### 15. Evolución 🚀

Este sistema está diseñado con una visión a futuro.

Hoy: 👉 Gestión completa del área de Golf
Futuro: 👉 Integración con otras áreas deportivas del club

* Tenis
* Pádel
* Eventos

A través de una API, el sistema podrá integrarse a una plataforma más amplia sin necesidad de reconstrucción.

---

### 16. Conclusión

Se propone un sistema enfocado en resolver de forma eficiente la operación del golf, con un modelo claro de membresías basado en acceso y beneficios preferenciales, reservas digitales y revenue management para socios sin membresía.

La solución permite mejorar ingresos, optimizar la ocupación del campo y simplificar la gestión diaria, al mismo tiempo que deja preparada la base tecnológica para la expansión a otras áreas del club.

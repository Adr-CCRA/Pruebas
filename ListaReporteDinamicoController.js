/**
 * Created by Fernando Mendoza Escobar on 19/08/2019.
 * Controller es el controlador de la Seccion donde se encuentran las funciones que se utilizaran
 * para las diferentes operativas dentro la seccion.
 * Este controlador importa las consultas del Modelo de la Seccion
 */

// TODO Importar React, redux, nodes
var uuid = require('uuid')
var snc = require('snc')
import Entidades from '../../../datos/Entidades'
let entidades = new Entidades()
// TODO Importar archivos JS (Gestores, Controladores, Componentes)
import Model from './ListaReporteDinamicoModel.js'
import ContextoDatos from './../../services/ContextoDatos.js'
import GestorUtilitarios from '../../services/GestorUtilitarios'
import { formatoFechaHora } from '../../../datos/eTextos'
import GestorReporteEspecial from '../../services/GestorReporteEspecial/GestorReporteEspecial.js'
import GestorReporte from '../../services/GestorReporte.js'
import Alertify from 'alertifyjs'
// TODO CONSTANTES
export const SECCION_OBTENER = 'SECCION_OBTENER'
export const ASIGNAR_DATOS_ENTIDAD = 'ASIGNAR_DATOS_ENTIDAD'
export const ASIGNAR_DATOS_PARAMETROS = 'ASIGNAR_DATOS_PARAMETROS'
export const ASIGNAR_PARAMETROS_VACIO = 'ASIGNAR_PARAMETROS_VACIO'
export const OBTENER_CONDICION_MODIFICAR = 'OBTENER_CONDICION_MODIFICAR'
export const VALIDACION_ESPECIFICA = 'VALIDACION_ESPECIFICA'

export const SECCION_GUARDAR = 'SECCION_GUARDAR'
export const SECCION_MODIFICAR = 'SECCION_MODIFICAR'

// ------------------------------------
// FUNCIONES
// ------------------------------------

/**
 * Metodo que Obtiene la informacion que se requiere para mostrar en la pantalla,
 * esta se comunica con el Model para obtener las consultas necesarias.
 * Una ves armada la informacino de la Seccion la devuelce a la pantalla mediate un Promesa
 */
export function Obtener (DatosSeccion = [], DatosGlobales = null, DatosFuncionGlobal = null) {
  console.log('Obtener Controller', DatosSeccion, DatosGlobales)
  let contextoDatos = new ContextoDatos()
  let Modelo = new Model()
  let IdCliente = DatosGlobales.IdClienteActual
  let IdEvaluacion = DatosGlobales.IdEvaluacion
  let Consulta = [
    { sql: Modelo.ConsultaPrincipal(DatosGlobales.IdRol), tipo: 'consulta' },
    { sql: Modelo.ConsultaEvaluacionesSecundariasA(DatosGlobales.IdEvaluacionPadre), tipo: 'consulta' },
    { sql: Modelo.ConsultaEvaluacionesSecundarias(IdEvaluacion, IdCliente, 21), tipo: 'consulta' },
    { sql: Modelo.ConsultaGarantes(IdEvaluacion), tipo: 'consulta' }
  ]
  return new Promise(function (resolve, reject) {
    contextoDatos.EjecutarGenerico(Consulta, function (pRespuesta) {
      console.log('pRespuesta', pRespuesta.listaResultados)
      if (pRespuesta.listaResultados[0].Correcto) {
        if (pRespuesta.listaResultados[0].listaResultado.length > 0) {
          AsignarDatosParametros(DatosSeccion.Parametros, pRespuesta.listaResultados)
          DatosSeccion.DatosObtenidos = true
        } else {
          AsignarParametrosVacio(DatosSeccion.Parametros)
          DatosSeccion.DatosObtenidos = false
        }
        resolve({
          type: SECCION_OBTENER,
          DatosSeccion: DatosSeccion,
          DatosGlobales: DatosGlobales,
          Correcto: true
        })
      } else {
        resolve({
          type: SECCION_OBTENER,
          DatosSeccion: DatosSeccion,
          DatosGlobales: DatosGlobales,
          Correcto: false
        })
      }
    })
  })
}

/**
 * Metodo donde Asigna la informacion de la Base de datos a la seccion.
 * Una ves asignada la informacion la retorna
 */
export function AsignarDatosParametros (DatosSeccion = [], Datos = []) {
  console.log('AsignarDatosParametros Controller', DatosSeccion, Datos)
  AsignarParametrosVacio(DatosSeccion)
  DatosSeccion.ListaReporte.listaSimple = Datos[0].listaResultado
  DatosSeccion.ListaEvaluacionSecundaria.datos = parsearListados(Datos[1].listaResultado, 'secundarias')
  // TODO EVALUACIONES SECUNDARIAS DEL TITULAR
  let pEvaluacionSecundaria = Datos[2].listaResultado
  DatosSeccion.DatosEvaluacionSecundaria.ListaEvSecundariaTitular = pEvaluacionSecundaria
  // TODO participantes Garantes
  let pGarantes = Datos[3].listaResultado
  DatosSeccion.ListaParticipantes.datos = parsearListados(pGarantes, 'garantes')

  return {
    type : ASIGNAR_DATOS_PARAMETROS,
    DatosSeccion : DatosSeccion
  }
}

/**
 * Metodo que limpia la informacion de la Seccion
 * Una ves limpia la seccion la retorna
 */
export function AsignarParametrosVacio (DatosSeccion = []) {
  console.log('AsignarParametrosVacio Controller', DatosSeccion)
  DatosSeccion.ListaReporte.listaSimple = []
  DatosSeccion.ListaEvaluacionSecundaria.datos = []
  DatosSeccion.ListaParticipantes.datos = []

  return {
    type : ASIGNAR_PARAMETROS_VACIO,
    DatosSeccion : DatosSeccion
  }
}

function parsearListados (Datos = [], pTipo = '') {
  console.log('FormatearListaW', Datos)
  let arrayR = []
  for (let i = 0; i < Datos.length; i++) {
    switch (pTipo) {
      case 'secundarias':
        let valor = Datos[i].DescripcionActividad + ' (' + Datos[i].Nombres + ' - ' + Datos[i].Nombre + ')'
        arrayR.push(
          { id: Datos[i].IdEvaluacion,
            categoria: 'EVALUACION SECUNDARIA',
            idItem:Datos[i].IdEvaluacion,
            valor: valor,
            desc:valor }
        )
        break
      case 'garantes':
        let valorg = Datos[i].Nombres + ' - (' + Datos[i].Nombre + ')'
        arrayR.push(
          { id: Datos[i].IdCliente,
            categoria: 'PARTICIPANTES GARANTES',
            idItem:Datos[i].IdCliente,
            valor: valorg,
            desc:valorg }
        )
    }
  }
  return (arrayR)
}
/**
 * Metodo que asigna la informacion de la Vista a la entidad de la Seccion
 * Una ves asignada la informcion la retorna
 */
export function AsignarDatosEntidad (Entidad = [], DatosProps = null, DatosRefs = null) {
  console.log('AsignarDatosEntidad Controller', Entidad, DatosProps, DatosRefs, uuid.v4())
  /* if (!DatosProps.DatosObtenidos) {
    Entidad.IdPersona = uuid.v4()
  } */

  return {
    type : ASIGNAR_DATOS_ENTIDAD,
    entidad : Entidad
  }
}

/**
 * Metodo que devuelve la condicion de la modificaion de la entidad.
 * Retorna un objeto con la condicion
 */
export function ObtenerCondicionModificar (DatosSeccion = []) {
  let condicion = { IdPersona:DatosSeccion.Id.valor }
  return {
    type : OBTENER_CONDICION_MODIFICAR,
    condicion : condicion
  }
}

/**
 * Metodo donde se manda las validacinoes Especificas de la Seccion
 */
export function ValidacionesEspecificas (DatosSeccion = []) {
  let correcto = true
  let mensaje = ''
  let arrayValidaciones = []
  return {
    type: VALIDACION_ESPECIFICA,
    arrayValidaciones: arrayValidaciones,
    Correcto: correcto,
    Mensaje: mensaje
  }
}

/**
 * Método para registrar los roles
 */
export function RegistroReporte (DatosReferencias = {}, DatosSeccion = {}, DatosGlobales = {}) {
  console.log('RegistroRol', DatosReferencias, DatosSeccion, DatosGlobales)
  let contextoDatos = new ContextoDatos()
  let EntidadReporte = DatosSeccion.Entidad
  return new Promise((resolve, reject) => {
    let idReporte = uuid.v4()
    entidades.LimpiarEntidad(EntidadReporte)
    EntidadReporte.IdReporte = idReporte
    EntidadReporte.Nombre = DatosReferencias.NombreReporte.state.valor
    EntidadReporte.Direccion = DatosReferencias.DireccionMRT.state.valor
    EntidadReporte.Estructura = '[]'
    EntidadReporte.Tipo = 'Mixto'
    console.log('valores de la entidad', EntidadReporte)
    let Modelo = new Model()
    let Consulta = Modelo.ConsultaNombreRep(DatosReferencias.NombreReporte.state.valor)

    contextoDatos.EjecutarSql(Consulta, function (pRespuesta) { // llamando a la ejecucion de la consulta
      console.log('pRespuestaRegistrowwwwwww', pRespuesta)
      if (pRespuesta.Correcto) {
        if (pRespuesta.listaResultado.length === 0) {
          contextoDatos.InsertarRegistro(EntidadReporte, function (pRespInsertarRep) {
            console.log('pRespInsertarRol', pRespInsertarRep)
            if (pRespInsertarRep.Correcto) {
              let EntidadRolRep = entidades.obtenerEntidad('RolReporte')
              EntidadRolRep.IdRol = DatosGlobales.IdRol
              EntidadRolRep.IdReporte = idReporte
              EntidadRolRep.Configurador = 1
              contextoDatos.InsertarRegistro(EntidadRolRep, function (pRespInsertarRolRep) {
                console.log('pRespInsertarRol', pRespInsertarRolRep)
                if (pRespInsertarRolRep.Correcto) {
                  resolve({
                    type: SECCION_GUARDAR,
                    Mensaje: '',
                    Correcto: true
                  })
                } else {
                  resolve({
                    type: SECCION_GUARDAR,
                    Mensaje: 'Ocurrio un error al insertar',
                    Correcto: false
                  })
                }
              })
            } else {
              resolve({
                type: SECCION_GUARDAR,
                Mensaje: 'Ocurrio un error al insertar',
                Correcto: false
              })
            }
          })
        } else {
          resolve({
            type: SECCION_GUARDAR,
            Mensaje: 'Reporte existente',
            Correcto: false
          })
        }
      } else {
        resolve({
          type: SECCION_GUARDAR,
          Mensaje: 'Ocurrio un error al insertar',
          Correcto: false
        })
      }
    })
  })
}

export function generarReporteCP (pIdEtapa, pIdReporte, pDireccion, pTipo, DatosGlobales, nombre) {
  let gestorReporteEspecial = new GestorReporteEspecial()
  let contextoDatos = new ContextoDatos()
  return new Promise((resolve, reject) => {
    let Modelo = new Model()
    let gestorReporte = new GestorReporte()
    if (pIdEtapa === '9050580') {
      let consulta = Modelo.ConsultaTotalClientes(DatosGlobales.IdEvaluacion)
      contextoDatos.EjecutarSql(consulta, function (pRespuesta) {
        if (pRespuesta.Correcto) {
          snc.each(pRespuesta.listaResultado, (dato, pIndice, pNext, pEnd) => {
            gestorReporteEspecial.EjecutorReporte(pIdReporte, pDireccion, pTipo, DatosGlobales.IdEvaluacion
              , dato.IdCliente)
              .then(pRespReporteEspecial => {
                if (pRespReporteEspecial.Correcto) {
                  gestorReporte.generarReporte(`resource/${pDireccion}`, pRespReporteEspecial.Resultado
                    , true)
                    .then((pRespgenerarReporte) => {
                      let consulta = Modelo.ConsultaExisteCarpetaCliente(dato.IdCliente, DatosGlobales.IdEvaluacion
                        , pIdEtapa)
                      guardarCD(consulta, pRespgenerarReporte.reportBase64, DatosGlobales, pIdEtapa, nombre
                        , dato.IdCliente)
                        .then(response => {
                          if (response.Correcto){
                            resolve({
                              Correcto: true,
                              mensaje: 'El reporte se guardo correctamente'
                            })
                          } else {
                            resolve({
                              type: SECCION_GUARDAR,
                              Mensaje: 'Ocurrio un error al guardar el reporte',
                              Correcto: false
                            })
                          }
                        })
                    })
                } else {
                  resolve({
                    type: SECCION_GUARDAR,
                    Mensaje: 'Ocurrio un error al insertar',
                    Correcto: false
                  })
                }
              })
          })
        }
      })
    } else {
      gestorReporteEspecial.EjecutorReporte(pIdReporte, pDireccion, pTipo)
        .then(pRespReporteEspecial => {
          if (pRespReporteEspecial.Correcto) {
            gestorReporte.generarReporte(`resource/${pDireccion}`, pRespReporteEspecial.Resultado
              , true)
              .then((pRespgenerarReporte) => {
                let consulta = Modelo.ConsultaExisteCarpetaCliente(DatosGlobales.IdCliente, DatosGlobales.IdEvaluacion
                  , pIdEtapa)
                guardarCD(consulta, pRespgenerarReporte.reportBase64, DatosGlobales, pIdEtapa, nombre, '')
                  .then(response => {
                    if (response.Correcto){
                    resolve({
                      Correcto: true,
                      mensaje: 'El reporte se guardo correctamente'
                    })
                  } else {
                    resolve({
                      type: SECCION_GUARDAR,
                      Mensaje: 'Ocurrio un error al guardar el reporte',
                      Correcto: false
                    })
                  }
                  })
              })
          } else {
            resolve({
              type: SECCION_GUARDAR,
              Mensaje: 'Ocurrio un error al guardar el reporte',
              Correcto: false
            })
          }
        })
    }
  })
}

function guardarCD (consulta, pReportBase64, DatosGlobales, pIdEtapa, nombre, pIdCliente) {
  let contextoDatos = new ContextoDatos()
  let Entidad = new Entidades()
  return new Promise((resolve, reject) => {
    contextoDatos.EjecutarSql(consulta, function (pRespuesta) {
      if (pRespuesta.Correcto) {
        let entidades = {
          EFCliente: Entidad.obtenerEntidad('FolderCliente'), // Folder Cliente
          EFArchivo: Entidad.obtenerEntidad('FolderArchivo') // Folder Archivo
        }
        let condicion = {
          documento: pReportBase64,
          DatosGlobales: DatosGlobales,
          etapa: pIdEtapa,
          formato: 'pdf',
          nombre: nombre,
          IdCliente: pIdCliente
        }
        if (pRespuesta.listaResultado.length === 0) {
          condicion['sentencia'] = 'insertar'
          AsignarDatosEntidadCD(entidades, condicion)
            .then(pRespuestaArmarEntidad => {
              let { EFCliente, EFArchivo } = pRespuestaArmarEntidad.entidades
              contextoDatos.InsertarRegistro(EFCliente, function (pRespInserFolderCliCIC) {
                console.log('pRespInserFolderCliCIC', pRespInserFolderCliCIC)
                contextoDatos.InsertarRegistro(EFArchivo, function (pRespInserFolderArchCIC) {
                  console.log('pRespInserFolderArchCIC', pRespInserFolderArchCIC)
                  if (pRespInserFolderArchCIC.Correcto) {
                    resolve({
                      Correcto: true,
                      mensaje: 'Se registro correctamente el Folder Cliente y Folder Archivo.'
                    })
                  } else {
                    resolve({
                      Correcto: false,
                      mensaje: 'Error al registrar Folder Cliente y Folder Archivo.'
                    })
                  }
                })
              })
            })
        } else {
          entidades['EFCliente'] = pRespuesta.listaResultado[0]
          condicion['sentencia'] = 'actualizar'
          AsignarDatosEntidadCD(entidades, condicion)
            .then(pRespuestaArmarEntidad => {
              let { EFArchivo } = pRespuestaArmarEntidad.entidades
              contextoDatos.InsertarRegistro(EFArchivo, function (pRespInserFolderArchCIC) {
                console.log('pRespInserFolderArchCIC', pRespInserFolderArchCIC)
                if (pRespInserFolderArchCIC.Correcto) {
                  resolve({
                    Correcto: true,
                    mensaje: 'Se registro correctamente el folder Archivo.'
                  })
                } else {
                  resolve({
                    Correcto: false,
                    mensaje: ''
                  })
                }
              })
            })
        }
      }
    })
  })
}
const AsignarDatosEntidadCD = (entidades = {}, pCondicion = {}) => {
  let { EFCliente, EFArchivo } = entidades
  let { documento, sentencia, DatosGlobales, etapa, formato, nombre, IdCliente } = pCondicion
  let gestorUtilitarios = new GestorUtilitarios()
  let formatoHora = formatoFechaHora.FechaHoraMostrar
  let fechaHora = gestorUtilitarios.ObtenerFechaActual(formatoHora)

  return new Promise((resolve, reject) => {
    if (sentencia === 'insertar') {
      // Datos folder cliente
      EFCliente.IdFolder = uuid.v4()
      EFCliente.IdEvaluacion = DatosGlobales.IdEvaluacion
      EFCliente.IdTipoEvaluacion = DatosGlobales.TipoEvaluacion
      EFCliente.IdCliente = (IdCliente === '') ? DatosGlobales.IdClienteActual : IdCliente
      EFCliente.IdRol = DatosGlobales.IdRol
      EFCliente.IdEtapa = etapa
      EFCliente.Activo = '1'
    }
    switch (formato) {
      case 'pdf' :
        // Datos folder archivo SEGIP
        EFArchivo.IdArchivo = uuid.v4()
        EFArchivo.IdFolder = EFCliente.IdFolder
        EFArchivo.IdEvaluacion = DatosGlobales.IdEvaluacion
        EFArchivo.IdTipoEvaluacion = DatosGlobales.TipoEvaluacion
        EFArchivo.Nombre = `${nombre}-${fechaHora}.pdf`
        EFArchivo.Tipo = 'documentos'
        EFArchivo.IdBPM = DatosGlobales.IdBPM
        EFArchivo.Archivo = documento
        EFArchivo.Activo = '1'
        EFArchivo.ArchivoREDUCIDO = documento
        resolve({
          entidades: {
            EFCliente,
            EFArchivo
          }
        })
        break
      default:
        resolve({
          entidades: {
            EFCliente,
            EFArchivo
          }
        })
        break
    }
  })
}

/**
 * Mètodo para obtener los valores para garantias detalladas y trabajarlos
 */
export function ObtenerValoresReporte (DatosGlobales, DatosSeccion) {
  console.log('ObtenerValoresReporte', DatosGlobales, DatosSeccion)
  let Modelo = new Model()
  let contextoDatos = new ContextoDatos()
  let IdCliente = DatosGlobales.IdClienteActual
  let pEvaluacionSecundaria = DatosSeccion.DatosEvaluacionSecundaria.ListaEvSecundariaTitular
  console.log('pEvaluacionSecundaria', pEvaluacionSecundaria)
  let gestorReporteEspecial = new GestorReporteEspecial()
  // TODO BALANCE GENERAL
  // TODO ESTADO DE RESULTADOS
  let ventasMenTotalSecundario = 0
  let costoVentaMenTotalSecundario = 0
  let utilidadBrutaTotalSecundario = 0
  let gastOperNegocioTotalSecundario = 0
  let servPublNegocioTotalSecundario = 0
  let arriendoLocalTotalSecundario = 0
  let impuestosTotalSecundario = 0
  let transpNegocioTotalSecundario = 0
  let otrosGastNegocioTotalSecundario = 0
  let sueldoEmpleadosTotalSecundario = 0
  let cuotasPrestamoNegTotalSecundario = 0
  let utilidadOperativaTotalSecundario = 0
  let pDireccion = ''
  let pIdReporte = ''
  let pObjRowset = {}
  return new Promise((resolve, reject) => {
    snc.each(pEvaluacionSecundaria, (pItemEvSec, pIndiceEvSec, pNextEvSec, pEndEvSec) => {
      const consultaTipoEvaluacion = Modelo.DatosTipoEvaluacionSecundarios(pItemEvSec.IdEvaluacionSecundaria, IdCliente)
      console.log(consultaTipoEvaluacion)
      contextoDatos.EjecutarSql(consultaTipoEvaluacion, function (pRespTipoevaluacion) {
        if (pRespTipoevaluacion.Correcto && pRespTipoevaluacion.listaResultado.length > 0) {
          let pDireccionSec = ''
          let pIdReporteSec = ''
          switch (pRespTipoevaluacion.listaResultado[0].TipoEvaluacion) {
            case 'COMERCIO':
              // Comercio
              pDireccionSec = 'MedioAprobacionSecundariaComercio.mrt'
              pIdReporteSec = 'c2d83aad-ac35-4b66-a000-d437c3918397'
              break
            case 'SERVICIOS':
              // Servicio
              pDireccionSec = 'MedioAprobacionSecundariaServicios.mrt'
              pIdReporteSec = '4944a08c-b124-424a-9982-4366122ae082'
              break
            case 'PRODUCCION':
              // Produccion
              pDireccionSec = 'MedioAprobacionSecundariaProduccion.mrt'
              pIdReporteSec = '1307244c-b514-48fb-be40-3ec2ca87fc62'
              break
            case 'AGRÍCOLA/LÁCTEOS/PECUARIO':
              // Agricola, Pecuario y Lacteo
              pDireccionSec = 'MedioAprobacionSecundariaAgricola_Pecuario_Lacteo.mrt'
              pIdReporteSec = '3a16d1e9-8e29-4bfd-917a-29792c5838b6'
              break
            case 'TRANSPORTE':
              // Transporte
              pDireccionSec = 'MedioAprobacionSecundariaTransporte.mrt'
              pIdReporteSec = 'b84d9442-9d96-47b9-95de-4ed7e0dfb173'
              break
          }
          gestorReporteEspecial.EjecutorReporte(pIdReporteSec, pDireccionSec, 'Fijo', pItemEvSec.IdEvaluacionSecundaria)
            .then(pRespReporteEspecial => {
              if (pRespReporteEspecial.Correcto) {
                // TODO VALORES EVALUACION SECUNDARIA
                // TODO BALANCE GENERAL - SECUNDARIO
                // TODO ESTADO DE RESULTADOS - SECUNDARIO
                let ventasMenSecundario = pRespReporteEspecial.Resultado.rowset.D_VENTAS_MENSUALES
                let costoVentaMenSecundario =
                  pIdReporteSec === 'b84d9442-9d96-47b9-95de-4ed7e0dfb173'
                    ? 0 : pRespReporteEspecial.Resultado.rowset.D_COSTO_DE_VENTAS_MENSUALES
                let utilidadBrutaSecundario = pRespReporteEspecial.Resultado.rowset.D_UTILIDAD_BRUTA
                let gastOperNegocioSecundario = pRespReporteEspecial.Resultado.rowset.D_GASTOS_OPERATIVOS_DEL_NEG
                let servPublNegocioSecundario = pRespReporteEspecial.Resultado.rowset.D_SERVICIO_PUBLICO_DEL_NEGOCIO
                let arriendoLocalSecundario = pRespReporteEspecial.Resultado.rowset.D_ARRIENDO_LOCAL
                let impuestosSecundario = pRespReporteEspecial.Resultado.rowset.D_IMPUESTOS
                let transpNegocioSecundario = pRespReporteEspecial.Resultado.rowset.D_TRANSPORTE_DEL_NEGOCIO
                let otrosGastNegocioSecundario = pRespReporteEspecial.Resultado.rowset.D_OTROS_GASTOS_DEL_NEGOCIO
                let sueldoEmpleadosSecundario = pRespReporteEspecial.Resultado.rowset.D_SUELDOS_EMPLEADOS
                let cuotasPrestamoNegSecundario =
                  pRespReporteEspecial.Resultado.rowset.D_CUOTAS_DE_PRESTAMOS_PARA_EL_NEGOCIO
                let utilidadOperativaSecundario = pRespReporteEspecial.Resultado.rowset.D_UTILIDAD_OPERATIVA

                // TODO ESTADO DE RESULTADOS SECUNDARIO
                if (!isNaN(ventasMenSecundario) && parseFloat(ventasMenSecundario)) {
                  ventasMenTotalSecundario += ventasMenSecundario
                }
                if (!isNaN(costoVentaMenSecundario) && parseFloat(costoVentaMenSecundario)) {
                  costoVentaMenTotalSecundario += costoVentaMenSecundario
                }
                if (!isNaN(utilidadBrutaSecundario) && parseFloat(utilidadBrutaSecundario)) {
                  utilidadBrutaTotalSecundario += utilidadBrutaSecundario
                }
                if (!isNaN(gastOperNegocioSecundario) && parseFloat(gastOperNegocioSecundario)) {
                  gastOperNegocioTotalSecundario += gastOperNegocioSecundario
                }
                if (!isNaN(servPublNegocioSecundario) && parseFloat(servPublNegocioSecundario)) {
                  servPublNegocioTotalSecundario += servPublNegocioSecundario
                }
                if (!isNaN(arriendoLocalSecundario) && parseFloat(arriendoLocalSecundario)) {
                  arriendoLocalTotalSecundario += arriendoLocalSecundario
                }
                if (!isNaN(impuestosSecundario) && parseFloat(impuestosSecundario)) {
                  impuestosTotalSecundario += impuestosSecundario
                }
                if (!isNaN(transpNegocioSecundario) && parseFloat(transpNegocioSecundario)) {
                  transpNegocioTotalSecundario += transpNegocioSecundario
                }
                if (!isNaN(otrosGastNegocioSecundario) && parseFloat(otrosGastNegocioSecundario)) {
                  otrosGastNegocioTotalSecundario += otrosGastNegocioSecundario
                }
                if (!isNaN(sueldoEmpleadosSecundario) && parseFloat(sueldoEmpleadosSecundario)) {
                  sueldoEmpleadosTotalSecundario += sueldoEmpleadosSecundario
                }
                if (!isNaN(cuotasPrestamoNegSecundario) && parseFloat(cuotasPrestamoNegSecundario)) {
                  cuotasPrestamoNegTotalSecundario += cuotasPrestamoNegSecundario
                }
                if (!isNaN(utilidadOperativaSecundario) && parseFloat(utilidadOperativaSecundario)) {
                  utilidadOperativaTotalSecundario += utilidadOperativaSecundario
                }
                pNextEvSec()
              } else {
                Alertify.error(pRespReporteEspecial.Mensaje)
                resolve({
                  Correcto:  false,
                  Mensaje: 'Error al ejecutar consultas del gestor Reportes (Evaluacion Secundaria)'
                })
                pEndEvSec()
              }
            })
        } else {
          pNextEvSec()
        }
      })
    }, () => {
      switch (DatosGlobales.TipoEvaluacion) {
        case '3c425bbe-bda6-4ba6-823f-beb59d41ecbd':
          // Comercio
          pDireccion = 'BalanceGeneralComercio.mrt'
          pIdReporte = '40ace656-9547-4e4c-9a85-f91f334baafc'
          break
        case 'b1b8ab98-06b2-4ad6-a4f1-2d715cdcbf7c':
          // Agricola Pecuario Lacteo
          pDireccion = 'BalanceGeneralAgricola_Pecuario_Lacteo.mrt'
          pIdReporte = '4609235d-9019-45be-8386-3c2c83d0b171'
          break
        case 'dbf4c1b3-e353-4c37-bdb4-f098e237a314':
          // Produccion
          pDireccion = 'BalanceGeneralProduccion.mrt'
          pIdReporte = '60e241d8-6e8c-4930-a517-3cceedc963e5'
          break
        case '56af25b8-24b5-47e8-86a9-b47d4d053df9':
          // Servicios
          pDireccion = 'BalanceGeneralServicios.mrt'
          pIdReporte = 'f594e671-6dec-418d-b4f2-29f9a0ff3ecd'
          break
        case 'ef55b68c-32f7-42c9-b2a3-c658e9a7df1d':
          // Transporte
          pDireccion = 'BalanceGeneralTransporte.mrt'
          pIdReporte = '8fb7e4a7-c282-4635-9fb6-3e08ae9d843e'
          break
      }
      // TODO ESTADO DE RESULTADOS
      let VentasMenTotalPrincipal = ventasMenTotalSecundario
      let CostoVentaMenTotalPrincipal = costoVentaMenTotalSecundario
      let UtilidadBrutaTotalPrincipal = utilidadBrutaTotalSecundario
      let GastOperNegocioTotalPrincipal = gastOperNegocioTotalSecundario
      let ServPublNegocioTotalPrincipal = servPublNegocioTotalSecundario
      let ArriendoLocalTotalPrincipal = arriendoLocalTotalSecundario
      let ImpuestosTotalPrincipal = impuestosTotalSecundario
      let TranspNegocioTotalPrincipal = transpNegocioTotalSecundario
      let OtrosGastNegocioTotalPrincipal = otrosGastNegocioTotalSecundario
      let SueldoEmpleadosTotalPrincipal = sueldoEmpleadosTotalSecundario
      let CuotasPrestamoNegTotalPrincipal = cuotasPrestamoNegTotalSecundario
      let UtilidadOperativaTotalPrincipal = utilidadOperativaTotalSecundario
      gestorReporteEspecial.EjecutorReporte(pIdReporte, pDireccion, 'Fijo')
        .then(pRespReporteEspecialEvPrincipal => {
          console.log('pRespReporteEspecial', pRespReporteEspecialEvPrincipal)
          if (pRespReporteEspecialEvPrincipal.Correcto) {
            // TODO ESTADO DE RESULTADOS - PRINCIPAL
            let VentasMenPrincipal = pRespReporteEspecialEvPrincipal.Resultado.rowset.D_VENTAS_MENSUALES
            let CostoVentaMenPrincipal =
              DatosGlobales.TipoEvaluacion === 'ef55b68c-32f7-42c9-b2a3-c658e9a7df1d'
                ? 0 : pRespReporteEspecialEvPrincipal.Resultado.rowset.D_COSTO_DE_VENTAS_MENSUALES
            let UtilidadBrutaPrincipal = pRespReporteEspecialEvPrincipal.Resultado.rowset.D_UTILIDAD_BRUTA
            let GastOperNegocioPrincipal =
              pRespReporteEspecialEvPrincipal.Resultado.rowset.D_GASTOS_OPERATIVOS_DEL_NEG
            let ServPublNegocioPrincipal =
              pRespReporteEspecialEvPrincipal.Resultado.rowset.D_SERVICIO_PUBLICO_DEL_NEGOCIO
            let ArriendoLocalPrincipal = pRespReporteEspecialEvPrincipal.Resultado.rowset.D_ARRIENDO_LOCAL
            let ImpuestosPrincipal = pRespReporteEspecialEvPrincipal.Resultado.rowset.D_IMPUESTOS
            let TranspNegocioPrincipal = pRespReporteEspecialEvPrincipal.Resultado.rowset.D_TRANSPORTE_DEL_NEGOCIO
            let OtrosGastNegocioPrincipal = pRespReporteEspecialEvPrincipal.Resultado.rowset.D_OTROS_GASTOS_DEL_NEGOCIO
            let SueldoEmpleadosPrincipal = pRespReporteEspecialEvPrincipal.Resultado.rowset.D_SUELDOS_EMPLEADOS
            let CuotasPrestamoNegPrincipal =
              pRespReporteEspecialEvPrincipal.Resultado.rowset.D_CUOTAS_DE_PRESTAMOS_PARA_EL_NEGOCIO
            let UtilidadOperativaPrincipal = pRespReporteEspecialEvPrincipal.Resultado.rowset.D_UTILIDAD_OPERATIVA
            // TODO ESTADO DE RESULTADOS - PRINCIPAL
            if (!isNaN(VentasMenPrincipal) && parseFloat(VentasMenPrincipal)) {
              VentasMenTotalPrincipal = VentasMenPrincipal + ventasMenTotalSecundario
            }
            if (!isNaN(CostoVentaMenPrincipal) && parseFloat(CostoVentaMenPrincipal)) {
              CostoVentaMenTotalPrincipal = CostoVentaMenPrincipal + costoVentaMenTotalSecundario
            }
            if (!isNaN(UtilidadBrutaPrincipal) && parseFloat(UtilidadBrutaPrincipal)) {
              UtilidadBrutaTotalPrincipal = UtilidadBrutaPrincipal + utilidadBrutaTotalSecundario
            }
            if (!isNaN(GastOperNegocioPrincipal) && parseFloat(GastOperNegocioPrincipal)) {
              GastOperNegocioTotalPrincipal = GastOperNegocioPrincipal + gastOperNegocioTotalSecundario
            }
            if (!isNaN(ServPublNegocioPrincipal) && parseFloat(ServPublNegocioPrincipal)) {
              ServPublNegocioTotalPrincipal = ServPublNegocioPrincipal + servPublNegocioTotalSecundario
            }
            if (!isNaN(ArriendoLocalPrincipal) && parseFloat(ArriendoLocalPrincipal)) {
              ArriendoLocalTotalPrincipal = ArriendoLocalPrincipal + arriendoLocalTotalSecundario
            }
            if (!isNaN(ImpuestosPrincipal) && parseFloat(ImpuestosPrincipal)) {
              ImpuestosTotalPrincipal = ImpuestosPrincipal + impuestosTotalSecundario
            }
            if (!isNaN(TranspNegocioPrincipal) && parseFloat(TranspNegocioPrincipal)) {
              TranspNegocioTotalPrincipal = TranspNegocioPrincipal + transpNegocioTotalSecundario
            }
            if (!isNaN(OtrosGastNegocioPrincipal) && parseFloat(OtrosGastNegocioPrincipal)) {
              OtrosGastNegocioTotalPrincipal = OtrosGastNegocioPrincipal + otrosGastNegocioTotalSecundario
            }
            if (!isNaN(SueldoEmpleadosPrincipal) && parseFloat(SueldoEmpleadosPrincipal)) {
              SueldoEmpleadosTotalPrincipal = SueldoEmpleadosPrincipal + sueldoEmpleadosTotalSecundario
            }
            if (!isNaN(CuotasPrestamoNegPrincipal) && parseFloat(CuotasPrestamoNegPrincipal)) {
              CuotasPrestamoNegTotalPrincipal = CuotasPrestamoNegPrincipal + cuotasPrestamoNegTotalSecundario
            }
            if (!isNaN(UtilidadOperativaPrincipal) && parseFloat(UtilidadOperativaPrincipal)) {
              UtilidadOperativaTotalPrincipal = UtilidadOperativaPrincipal + utilidadOperativaTotalSecundario
            }
            // TODO TOTALES EVALUACION PRINCIPAL - EVALUACIONES SECUNDARIAS

            // TODO ESTADO DE RESULTADOS - PRINCIPAL TOTAL
            pRespReporteEspecialEvPrincipal.Resultado.rowset.D_VENTAS_MENSUALES_PRIN = VentasMenPrincipal
            pRespReporteEspecialEvPrincipal.Resultado.rowset.D_VENTAS_MENSUALES_SEC = ventasMenTotalSecundario
            pRespReporteEspecialEvPrincipal.Resultado.rowset.D_VENTAS_MENSUALES = VentasMenTotalPrincipal

            pRespReporteEspecialEvPrincipal.Resultado.rowset.D_COSTO_DE_VENTAS_MENSUALES_PRIN = CostoVentaMenPrincipal
            pRespReporteEspecialEvPrincipal.Resultado.rowset.D_COSTO_DE_VENTAS_MENSUALES_SEC =
              costoVentaMenTotalSecundario
            pRespReporteEspecialEvPrincipal.Resultado.rowset.D_COSTO_DE_VENTAS_MENSUALES = CostoVentaMenTotalPrincipal

            pRespReporteEspecialEvPrincipal.Resultado.rowset.D_UTILIDAD_BRUTA_PRIN = UtilidadBrutaPrincipal
            pRespReporteEspecialEvPrincipal.Resultado.rowset.D_UTILIDAD_BRUTA_SEC = utilidadBrutaTotalSecundario
            pRespReporteEspecialEvPrincipal.Resultado.rowset.D_UTILIDAD_BRUTA = UtilidadBrutaTotalPrincipal

            pRespReporteEspecialEvPrincipal.Resultado.rowset.D_GASTOS_OPERATIVOS_DEL_NEG_PRIN =
              GastOperNegocioPrincipal
            pRespReporteEspecialEvPrincipal.Resultado.rowset.D_GASTOS_OPERATIVOS_DEL_NEG_SEC =
              gastOperNegocioTotalSecundario
            pRespReporteEspecialEvPrincipal.Resultado.rowset.D_GASTOS_OPERATIVOS_DEL_NEG = GastOperNegocioTotalPrincipal

            if (!isNaN(ServPublNegocioPrincipal) && parseFloat(ServPublNegocioPrincipal)) {
              pRespReporteEspecialEvPrincipal.Resultado.rowset.D_SERVICIO_PUBLICO_DEL_NEGOCIO_PRIN =
                ServPublNegocioPrincipal
            } else {
              pRespReporteEspecialEvPrincipal.Resultado.rowset.D_SERVICIO_PUBLICO_DEL_NEGOCIO_PRIN = 0
            }
            pRespReporteEspecialEvPrincipal.Resultado.rowset.D_SERVICIO_PUBLICO_DEL_NEGOCIO_SEC =
              servPublNegocioTotalSecundario
            pRespReporteEspecialEvPrincipal.Resultado.rowset.D_SERVICIO_PUBLICO_DEL_NEGOCIO =
              ServPublNegocioTotalPrincipal

            if (!isNaN(ArriendoLocalPrincipal) && parseFloat(ArriendoLocalPrincipal)) {
              pRespReporteEspecialEvPrincipal.Resultado.rowset.D_ARRIENDO_LOCAL_PRIN = ArriendoLocalPrincipal
            } else {
              pRespReporteEspecialEvPrincipal.Resultado.rowset.D_ARRIENDO_LOCAL_PRIN = 0
            }
            pRespReporteEspecialEvPrincipal.Resultado.rowset.D_ARRIENDO_LOCAL_SEC = arriendoLocalTotalSecundario
            pRespReporteEspecialEvPrincipal.Resultado.rowset.D_ARRIENDO_LOCAL = ArriendoLocalTotalPrincipal

            if (!isNaN(ImpuestosPrincipal) && parseFloat(ImpuestosPrincipal)) {
              pRespReporteEspecialEvPrincipal.Resultado.rowset.D_IMPUESTOS_PRIN = ImpuestosPrincipal
            } else {
              pRespReporteEspecialEvPrincipal.Resultado.rowset.D_IMPUESTOS_PRIN = 0
            }
            pRespReporteEspecialEvPrincipal.Resultado.rowset.D_IMPUESTOS_SEC = impuestosTotalSecundario
            pRespReporteEspecialEvPrincipal.Resultado.rowset.D_IMPUESTOS = ImpuestosTotalPrincipal

            if (!isNaN(TranspNegocioPrincipal) && parseFloat(TranspNegocioPrincipal)) {
              pRespReporteEspecialEvPrincipal.Resultado.rowset.D_TRANSPORTE_DEL_NEGOCIO_PRIN = TranspNegocioPrincipal
            } else {
              pRespReporteEspecialEvPrincipal.Resultado.rowset.D_TRANSPORTE_DEL_NEGOCIO_PRIN = 0
            }
            pRespReporteEspecialEvPrincipal.Resultado.rowset.D_TRANSPORTE_DEL_NEGOCIO_SEC = transpNegocioTotalSecundario
            pRespReporteEspecialEvPrincipal.Resultado.rowset.D_TRANSPORTE_DEL_NEGOCIO = TranspNegocioTotalPrincipal

            if (!isNaN(OtrosGastNegocioPrincipal) && parseFloat(OtrosGastNegocioPrincipal)) {
              pRespReporteEspecialEvPrincipal.Resultado.rowset.D_OTROS_GASTOS_DEL_NEGOCIO_PRIN =
                OtrosGastNegocioPrincipal
            } else {
              pRespReporteEspecialEvPrincipal.Resultado.rowset.D_OTROS_GASTOS_DEL_NEGOCIO_PRIN = 0
            }
            pRespReporteEspecialEvPrincipal.Resultado.rowset.D_OTROS_GASTOS_DEL_NEGOCIO_SEC =
              otrosGastNegocioTotalSecundario
            pRespReporteEspecialEvPrincipal.Resultado.rowset.D_OTROS_GASTOS_DEL_NEGOCIO = OtrosGastNegocioTotalPrincipal

            pRespReporteEspecialEvPrincipal.Resultado.rowset.D_SUELDOS_EMPLEADOS_PRIN = SueldoEmpleadosPrincipal
            pRespReporteEspecialEvPrincipal.Resultado.rowset.D_SUELDOS_EMPLEADOS_SEC = sueldoEmpleadosTotalSecundario
            pRespReporteEspecialEvPrincipal.Resultado.rowset.D_SUELDOS_EMPLEADOS = SueldoEmpleadosTotalPrincipal

            pRespReporteEspecialEvPrincipal.Resultado.rowset.D_CUOTAS_DE_PRESTAMOS_PARA_EL_NEGOCIO_PRIN =
              CuotasPrestamoNegPrincipal
            pRespReporteEspecialEvPrincipal.Resultado.rowset.D_CUOTAS_DE_PRESTAMOS_PARA_EL_NEGOCIO_SEC =
              cuotasPrestamoNegTotalSecundario
            pRespReporteEspecialEvPrincipal.Resultado.rowset.D_CUOTAS_DE_PRESTAMOS_PARA_EL_NEGOCIO =
              CuotasPrestamoNegTotalPrincipal

            pRespReporteEspecialEvPrincipal.Resultado.rowset.D_UTILIDAD_OPERATIVA_PRIN = UtilidadOperativaPrincipal
            pRespReporteEspecialEvPrincipal.Resultado.rowset.D_UTILIDAD_OPERATIVA_SEC = utilidadOperativaTotalSecundario
            pRespReporteEspecialEvPrincipal.Resultado.rowset.D_UTILIDAD_OPERATIVA = UtilidadOperativaTotalPrincipal

            pObjRowset.rowset = pRespReporteEspecialEvPrincipal.Resultado.rowset
            // gestorReporte.generarReporte(`resource/${pDireccion}`, pObjRowset)
            resolve({
              Correcto:  true,
              ObjetoMrt: pObjRowset,
              Direccion: pDireccion,
              IdReporte: pIdReporte,
              Mensaje: 'Se genero correctamente el objeto para el reporte'
            })
          } else {
            Alertify.error(pRespReporteEspecialEvPrincipal.Mensaje)
            resolve({
              Correcto:  false,
              Mensaje: 'Error al ejecutar consultas del gestor Reportes (Evaluacion Principal)'
            })
          }
        })
    })
  })
}
/**
 * Exporta las funciones globales y especificas
 * @type {{Obtener: Obtener,
 * AsignarDatosParametros: AsignarDatosParametros,
 * AsignarParametrosVacio: AsignarParametrosVacio,
 * Romanize: Romanize,
 * ConsultaPrincipal: ConsultaPrincipal}}
 */
export const actions = {
  // Funciones Comunes del Controlador
  Obtener,
  AsignarDatosParametros,
  AsignarParametrosVacio,
  AsignarDatosEntidad,
  ObtenerCondicionModificar,
  ValidacionesEspecificas,
  RegistroReporte,
  ObtenerValoresReporte

  // Funciones Especificas del Controlador

}


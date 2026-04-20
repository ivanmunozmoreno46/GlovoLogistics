import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

export interface HotInput {
  order_id: string;
  event_type: string;
  timestamp: string;
  details: string;
  [key: string]: any;
}

export interface ColdInput {
  id: string;
  order_id: string;
  event_type: string;
  status: string;
  zona_id: string;
  timestamp: string;
  details: string;
  [key: string]: any;
}

const HOT_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    modo: { type: Type.STRING, description: "Must be 'HOT'" },
    payload: {
      type: Type.OBJECT,
      properties: {
        resultado: {
          type: Type.OBJECT,
          properties: {
            prioridad: { type: Type.INTEGER, description: "1-5 according to customer impact" },
            accion_recomendada: { type: Type.STRING, description: "Technical action to take" },
            idempotency_key: { type: Type.STRING, description: "Formed by order_id + event_type" }
          },
          required: ["prioridad", "accion_recomendada", "idempotency_key"]
        },
        metadatos: {
          type: Type.OBJECT,
          properties: {
            tokens_procesados: { type: Type.INTEGER },
            latencia_estimada: { type: Type.INTEGER }
          }
        }
      },
      required: ["resultado", "metadatos"]
    },
    control_error: {
      type: Type.OBJECT,
      properties: {
        idempotencia_check: { type: Type.STRING },
        retry_recommended: { type: Type.BOOLEAN }
      },
      required: ["idempotencia_check", "retry_recommended"]
    }
  },
  required: ["modo", "payload", "control_error"]
};

const COLD_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    modo: { type: Type.STRING, description: "Must be 'COLD'" },
    payload: {
      type: Type.OBJECT,
      properties: {
        resultado: {
          type: Type.OBJECT,
          properties: {
            resumen_ejecutivo: { type: Type.STRING, description: "One paragraph with daily highlights" },
            zonas_criticas: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Zones with >15% failure rate" 
            },
            recomendacion_estrategica: { type: Type.STRING, description: "What to change tomorrow" }
          },
          required: ["resumen_ejecutivo", "zonas_criticas", "recomendacion_estrategica"]
        },
        metadatos: {
          type: Type.OBJECT,
          properties: {
            tokens_procesados: { type: Type.INTEGER },
            latencia_estimada: { type: Type.INTEGER }
          }
        }
      },
      required: ["resultado", "metadatos"]
    },
    control_error: {
      type: Type.OBJECT,
      properties: {
        idempotencia_check: { type: Type.STRING },
        retry_recommended: { type: Type.BOOLEAN }
      },
      required: ["idempotencia_check", "retry_recommended"]
    }
  },
  required: ["modo", "payload", "control_error"]
};

export async function processHotIncident(data: HotInput) {
  const startTime = Date.now();
  const prompt = `Actúa como un Motor Inteligente de Operaciones Logísticas para Glovo.
MODO: HOT (Incidencia Individual).
Tarea: Clasificar la gravedad (prioridad 1-5), extraer la entidad del problema y proponer una acción inmediata.
IDEMPOTENCY_KEY: Debe ser la combinación de order_id + event_type.

Input: ${JSON.stringify(data, null, 2)}`;

  const result = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: HOT_SCHEMA as any
    }
  });

  const parsed = JSON.parse(result.text || "{}");
  // Update internal metadata with actual measurements
  parsed.payload.metadatos.latencia_estimada = Date.now() - startTime;
  // Tokens processed is a mock since the API doesn't return it directly in this simple call easily without usage field
  parsed.payload.metadatos.tokens_procesados = Math.floor(prompt.length / 4); 
  
  return parsed;
}

export async function processColdBatch(data: ColdInput[]) {
  const startTime = Date.now();
  
  // Rule: Detect duplicates in COLD mode
  const filteredData = data.filter((item, index, self) => 
    index === self.findIndex((t) => (
      t.id === item.id && t.status === item.status
    ))
  );

  const prompt = `Actúa como un Motor Inteligente de Operaciones Logísticas para Glovo.
MODO: COLD (Resumen Diario por Zona).
Tarea: Detectar patrones, agrupar por zona_id y generar un resumen ejecutivo de anomalías.
Zonas críticas: Identifica aquellas con más del 15% de fallos.

Input: ${JSON.stringify(filteredData, null, 2)}`;

  const result = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview", // Use Pro for batch analysis as it might require more reasoning
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: COLD_SCHEMA as any
    }
  });

  const parsed = JSON.parse(result.text || "{}");
  parsed.payload.metadatos.latencia_estimada = Date.now() - startTime;
  parsed.payload.metadatos.tokens_procesados = Math.floor(prompt.length / 4);

  return parsed;
}

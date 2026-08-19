import { config as loadDotenv } from "dotenv";
import neo4j, { type Session } from "neo4j-driver";
import { loadCognoDBConfig } from "../../lib/cognodb/config";

loadDotenv({ path: ".env.local" });
loadDotenv({ path: ".env" });

type Rng = () => number;

function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: Rng, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)] as T;
}

function randInt(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

function isoDate(rng: Rng, fromYear: number, toYear: number): string {
  const year = randInt(rng, fromYear, toYear);
  const month = randInt(rng, 1, 12);
  const day = randInt(rng, 1, 28);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

interface PersonName {
  firstName: string;
  lastName: string;
  gender: "male" | "female";
}

/**
 * Generate a person's name with a gender-consistent first name and a shared
 * family (father's) surname. The first name is drawn from the gender-appropriate
 * pool and therefore determines the gender; the surname comes from the shared
 * SURNAMES list (the father's family name) for both male and female persons.
 */
function randomPersonName(rng: Rng): PersonName {
  const gender = pick(rng, ["male", "female"] as const);
  const firstName =
    gender === "male"
      ? pick(rng, MALE_FIRST_NAMES)
      : pick(rng, FEMALE_FIRST_NAMES);
  return {
    firstName,
    lastName: pick(rng, SURNAMES),
    gender,
  };
}

/**
 * Generate a unique 12-digit national ID. Re-picks until the id is not already
 * in `used`, so IDs are deterministic (via the seeded rng) and unique.
 */
function randomNationalId(rng: Rng, used: Set<string>): string {
  let id: string;
  do {
    id = String(randInt(rng, 100000000000, 999999999999));
  } while (used.has(id));
  used.add(id);
  return id;
}

export const SEED = {
  patients: 30,
  doctors: 15,
  departments: 8,
  diseases: 25,
  medications: 35,
  minVisits: 2,
  maxVisits: 5,
};

const MALE_FIRST_NAMES = [
  "James", "John", "Robert", "Michael", "David", "William", "Richard", "Joseph",
  "Thomas", "Charles", "Christopher", "Daniel", "Matthew", "Anthony", "Mark",
  "Donald", "Steven", "Paul", "Andrew", "Joshua", "Kenneth", "Kevin", "Brian",
  "George", "Timothy", "Ronald", "Edward", "Jason", "Jeffrey", "Ryan",
];

const FEMALE_FIRST_NAMES = [
  "Mary", "Patricia", "Jennifer", "Linda", "Elizabeth", "Barbara", "Susan",
  "Jessica", "Sarah", "Karen", "Lisa", "Nancy", "Betty", "Margaret", "Sandra",
  "Ashley", "Kimberly", "Emily", "Donna", "Michelle", "Carol", "Amanda",
  "Dorothy", "Melissa", "Deborah", "Stephanie", "Rebecca", "Sharon", "Laura",
  "Cynthia",
];

const SURNAMES = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
  "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson",
  "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee",
  "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez",
  "Lewis", "Robinson",
];

const DISEASES: ReadonlyArray<{ name: string; category: string }> = [
  { name: "Type 2 Diabetes", category: "Metabolic" },
  { name: "Hypertension", category: "Cardiovascular" },
  { name: "Asthma", category: "Respiratory" },
  { name: "Migraine", category: "Neurological" },
  { name: "Gastritis", category: "Gastrointestinal" },
  { name: "Chronic Bronchitis", category: "Respiratory" },
  { name: "Hypothyroidism", category: "Endocrine" },
  { name: "Osteoarthritis", category: "Musculoskeletal" },
  { name: "Urinary Tract Infection", category: "Infectious" },
  { name: "Coronary Artery Disease", category: "Cardiovascular" },
  { name: "Anxiety Disorder", category: "Neurological" },
  { name: "Irritable Bowel Syndrome", category: "Gastrointestinal" },
  { name: "Hyperlipidemia", category: "Metabolic" },
  { name: "Tonsillitis", category: "Infectious" },
  { name: "Rheumatoid Arthritis", category: "Musculoskeletal" },
  { name: "Epilepsy", category: "Neurological" },
  { name: "Pneumonia", category: "Respiratory" },
  { name: "Peptic Ulcer", category: "Gastrointestinal" },
  { name: "Atrial Fibrillation", category: "Cardiovascular" },
  { name: "Anemia", category: "Endocrine" },
  { name: "Dermatitis", category: "Musculoskeletal" },
  { name: "Bronchitis", category: "Respiratory" },
  { name: "Nephrolithiasis", category: "Gastrointestinal" },
  { name: "Hyperthyroidism", category: "Endocrine" },
  { name: "Myocardial Ischemia", category: "Cardiovascular" },
];

const MEDICATIONS: ReadonlyArray<{ name: string; dosageForm: string }> = [
  { name: "Metformin", dosageForm: "Tablet" },
  { name: "Amlodipine", dosageForm: "Tablet" },
  { name: "Salbutamol", dosageForm: "Inhaler" },
  { name: "Sumatriptan", dosageForm: "Tablet" },
  { name: "Omeprazole", dosageForm: "Capsule" },
  { name: "Amoxicillin", dosageForm: "Capsule" },
  { name: "Levothyroxine", dosageForm: "Tablet" },
  { name: "Diclofenac", dosageForm: "Tablet" },
  { name: "Nitrofurantoin", dosageForm: "Capsule" },
  { name: "Amlodipine + Atorvastatin", dosageForm: "Tablet" },
  { name: "Sertraline", dosageForm: "Tablet" },
  { name: "Mebeverine", dosageForm: "Capsule" },
  { name: "Rosuvastatin", dosageForm: "Tablet" },
  { name: "Penicillin V", dosageForm: "Tablet" },
  { name: "Methotrexate", dosageForm: "Tablet" },
  { name: "Sodium Valproate", dosageForm: "Tablet" },
  { name: "Azithromycin", dosageForm: "Tablet" },
  { name: "Pantoprazole", dosageForm: "Tablet" },
  { name: "Warfarin", dosageForm: "Tablet" },
  { name: "Ferrous Sulfate", dosageForm: "Tablet" },
  { name: "Hydrocortisone", dosageForm: "Cream" },
  { name: "Prednisolone", dosageForm: "Tablet" },
  { name: "Diclofenac Sodium", dosageForm: "Injection" },
  { name: "Carbamazepine", dosageForm: "Tablet" },
  { name: "Methimazole", dosageForm: "Tablet" },
  { name: "Isosorbide Dinitrate", dosageForm: "Tablet" },
  { name: "Metoprolol", dosageForm: "Tablet" },
  { name: "Losartan", dosageForm: "Tablet" },
  { name: "Enalapril", dosageForm: "Tablet" },
  { name: "Furosemide", dosageForm: "Tablet" },
  { name: "Diazepam", dosageForm: "Tablet" },
  { name: "Paracetamol", dosageForm: "Tablet" },
  { name: "Ibuprofen", dosageForm: "Tablet" },
  { name: "Cetirizine", dosageForm: "Tablet" },
  { name: "Loperamide", dosageForm: "Capsule" },
];

const SPECIALTIES = [
  "Cardiology", "Endocrinology", "Pulmonology", "Neurology",
  "Gastroenterology", "Internal Medicine", "Rheumatology", "General Practice",
];

interface Department { id: string; name: string }
interface Disease { id: string; name: string; category: string }
interface Medication { id: string; name: string; dosageForm: string }
interface Doctor { id: string; name: string; specialty: string }
interface Patient {
  id: string; publicId: string; nationalId: string; firstName: string; lastName: string;
  dateOfBirth: string; gender: string;
}
interface Visit {
  id: string; patientId: string; doctorId: string; deptId: string;
  visitDate: string; reason: string; notes: string;
}
interface DiagnosisRecord {
  id: string; visitId: string; diseaseId: string;
  diagnosedAt: string; severity: string; notes: string;
}
interface PrescriptionRecord {
  id: string; visitId: string; medicationId: string;
  prescribedAt: string; dosage: string; frequency: string; duration: string;
}
interface CurrentEdge { patientId: string; targetId: string; status: string; since: string }

export function generateDataset(rng: Rng) {
  const usedNationalIds = new Set<string>();
  const departments: Department[] = Array.from(
    { length: SEED.departments },
    (_, i) => ({
      id: `dept-${i + 1}`,
      name: `Department of ${pick(rng, SPECIALTIES)}`,
    })
  );

  const diseases: Disease[] = DISEASES.map((d, i) => ({
    id: `d-${i + 1}`,
    ...d,
  }));

  const medications: Medication[] = MEDICATIONS.map((m, i) => ({
    id: `m-${i + 1}`,
    ...m,
  }));

  const doctors: Doctor[] = Array.from({ length: SEED.doctors }, (_, i) => {
    const { firstName, lastName } = randomPersonName(rng);
    return {
      id: `doc-${i + 1}`,
      name: `Dr. ${firstName} ${lastName}`,
      specialty: pick(rng, SPECIALTIES),
    };
  });

  const patients: Patient[] = Array.from({ length: SEED.patients }, (_, i) => {
    const { firstName, lastName, gender } = randomPersonName(rng);
    return {
      id: `pat-${i + 1}`,
      publicId: `P-${String(1001 + i)}`,
      nationalId: randomNationalId(rng, usedNationalIds),
      firstName,
      lastName,
      dateOfBirth: isoDate(rng, 1945, 2015),
      gender,
    };
  });

  const visits: Visit[] = [];
  const diagnoses: DiagnosisRecord[] = [];
  const prescriptions: PrescriptionRecord[] = [];
  const doctorEdges: Array<{ doctorId: string; deptId: string }> = [];
  const diseaseEdges: CurrentEdge[] = [];
  const medicationEdges: CurrentEdge[] = [];

  let visitCounter = 0;
  let diagnosisCounter = 0;
  let prescriptionCounter = 0;

  for (const p of patients) {
    const visitCount = randInt(rng, SEED.minVisits, SEED.maxVisits);
    const patientDiseases = new Set<string>();
    const patientMedications = new Set<string>();

    for (let v = 0; v < visitCount; v++) {
      const visitId = `visit-${++visitCounter}`;
      const doctorId = pick(rng, doctors).id;
      visits.push({
        id: visitId,
        patientId: p.id,
        doctorId,
        deptId: departments[randInt(rng, 0, departments.length - 1)]!.id,
        visitDate: isoDate(rng, 2018, 2024),
        reason: pick(rng, [
          "Routine checkup", "Chest pain", "Fever", "Headache",
          "Abdominal pain", "Persistent cough", "Routine follow-up",
          "Fatigue", "Shortness of breath", "Joint pain",
        ]),
        notes: "Synthetic record for demonstration.",
      });

      const diagCount = randInt(rng, 1, 2);
      for (let d = 0; d < diagCount; d++) {
        const disease = pick(rng, diseases);
        patientDiseases.add(disease.id);
        diagnoses.push({
          id: `diag-${++diagnosisCounter}`,
          visitId,
          diseaseId: disease.id,
          diagnosedAt: isoDate(rng, 2018, 2024),
          severity: pick(rng, ["mild", "moderate", "severe"] as const),
          notes: "Synthetic diagnosis for demonstration.",
        });
      }

      const medication = pick(rng, medications);
      patientMedications.add(medication.id);
      prescriptions.push({
        id: `rx-${++prescriptionCounter}`,
        visitId,
        medicationId: medication.id,
        prescribedAt: isoDate(rng, 2018, 2024),
        dosage: `${pick(rng, ["5", "10", "20", "50", "100"])} mg`,
        frequency: pick(rng, ["once daily", "twice daily", "every 8 hours", "as needed"]),
        duration: `${randInt(rng, 5, 30)} days`,
      });
    }

    for (const diseaseId of patientDiseases) {
      diseaseEdges.push({
        patientId: p.id,
        targetId: diseaseId,
        status: pick(rng, ["active", "resolved"] as const),
        since: isoDate(rng, 2018, 2024),
      });
    }
    for (const medicationId of patientMedications) {
      medicationEdges.push({
        patientId: p.id,
        targetId: medicationId,
        status: pick(rng, ["active", "discontinued"] as const),
        since: isoDate(rng, 2018, 2024),
      });
    }
  }

  for (const doc of doctors) {
    doctorEdges.push({
      doctorId: doc.id,
      deptId: departments[randInt(rng, 0, departments.length - 1)]!.id,
    });
  }

  return {
    departments, diseases, medications, doctors, patients,
    visits, diagnoses, prescriptions, doctorEdges, diseaseEdges, medicationEdges,
  };
}

const CONSTRAINTS = [
  "CREATE CONSTRAINT patient_id IF NOT EXISTS FOR (n:Patient) REQUIRE n.id IS UNIQUE",
  "CREATE CONSTRAINT patient_nationalId IF NOT EXISTS FOR (n:Patient) REQUIRE n.nationalId IS UNIQUE",
  "CREATE CONSTRAINT visit_id IF NOT EXISTS FOR (n:Visit) REQUIRE n.id IS UNIQUE",
  "CREATE CONSTRAINT doctor_id IF NOT EXISTS FOR (n:Doctor) REQUIRE n.id IS UNIQUE",
  "CREATE CONSTRAINT department_id IF NOT EXISTS FOR (n:Department) REQUIRE n.id IS UNIQUE",
  "CREATE CONSTRAINT disease_id IF NOT EXISTS FOR (n:Disease) REQUIRE n.id IS UNIQUE",
  "CREATE CONSTRAINT medication_id IF NOT EXISTS FOR (n:Medication) REQUIRE n.id IS UNIQUE",
  "CREATE CONSTRAINT diagnosis_id IF NOT EXISTS FOR (n:Diagnosis) REQUIRE n.id IS UNIQUE",
  "CREATE CONSTRAINT prescription_id IF NOT EXISTS FOR (n:Prescription) REQUIRE n.id IS UNIQUE",
];

async function run(session: Session, cypher: string, params: unknown): Promise<void> {
  await session.run(cypher, params as Record<string, unknown>);
}

async function main() {
  const config = loadCognoDBConfig();
  const driver = neo4j.driver(
    config.uri,
    neo4j.auth.basic(config.username, config.password)
  );
  const session = driver.session({ database: config.database });

  const rng = mulberry32(20260819);

  try {
    // Deterministic seed: clear any prior data so re-runs are identical.
    console.log("Clearing existing graph...");
    await run(session, "MATCH (n) DETACH DELETE n", {});

    console.log("Creating constraints/indexes...");
    for (const c of CONSTRAINTS) {
      await run(session, c, {});
    }

    const data = generateDataset(rng);
    console.log(
      `Seeding ${data.patients.length} patients, ${data.doctors.length} doctors, ` +
        `${data.departments.length} departments, ${data.diseases.length} diseases, ` +
        `${data.medications.length} medications, ${data.visits.length} visits, ` +
        `${data.diagnoses.length} diagnoses, ${data.prescriptions.length} prescriptions`
    );

    await run(
      session,
      "UNWIND $rows AS row MERGE (n:Department {id: row.id}) SET n.name = row.name",
      { rows: data.departments }
    );
    await run(
      session,
      "UNWIND $rows AS row MERGE (n:Disease {id: row.id}) SET n.name = row.name, n.category = row.category",
      { rows: data.diseases }
    );
    await run(
      session,
      "UNWIND $rows AS row MERGE (n:Medication {id: row.id}) SET n.name = row.name, n.dosageForm = row.dosageForm",
      { rows: data.medications }
    );
    await run(
      session,
      "UNWIND $rows AS row MERGE (n:Doctor {id: row.id}) SET n.name = row.name, n.specialty = row.specialty",
      { rows: data.doctors }
    );
    await run(
      session,
      "UNWIND $rows AS row MERGE (n:Patient {id: row.id}) SET n.publicId = row.publicId, n.nationalId = row.nationalId, n.firstName = row.firstName, n.lastName = row.lastName, n.dateOfBirth = row.dateOfBirth, n.gender = row.gender",
      { rows: data.patients }
    );

    await run(
      session,
      "UNWIND $rows AS row MATCH (doc:Doctor {id: row.doctorId}) MATCH (d:Department {id: row.deptId}) MERGE (doc)-[:WORKS_IN]->(d)",
      { rows: data.doctorEdges }
    );
    await run(
      session,
      "UNWIND $rows AS row MATCH (p:Patient {id: row.patientId}) MERGE (v:Visit {id: row.id}) SET v.visitDate = row.visitDate, v.reason = row.reason, v.notes = row.notes MERGE (p)-[:HAD_VISIT]->(v)",
      { rows: data.visits }
    );
    await run(
      session,
      "UNWIND $rows AS row MATCH (v:Visit {id: row.id}) MATCH (doc:Doctor {id: row.doctorId}) MERGE (v)-[:TREATED_BY]->(doc)",
      { rows: data.visits }
    );
    await run(
      session,
      "UNWIND $rows AS row MATCH (v:Visit {id: row.visitId}) MERGE (dg:Diagnosis {id: row.id}) SET dg.diagnosedAt = row.diagnosedAt, dg.severity = row.severity, dg.notes = row.notes MERGE (v)-[:RESULTED_IN]->(dg) WITH dg, row MATCH (dis:Disease {id: row.diseaseId}) MERGE (dg)-[:FOR_DISEASE]->(dis)",
      { rows: data.diagnoses }
    );
    await run(
      session,
      "UNWIND $rows AS row MATCH (v:Visit {id: row.visitId}) MERGE (rx:Prescription {id: row.id}) SET rx.prescribedAt = row.prescribedAt, rx.dosage = row.dosage, rx.frequency = row.frequency, rx.duration = row.duration MERGE (v)-[:GENERATED]->(rx) WITH rx, row MATCH (m:Medication {id: row.medicationId}) MERGE (rx)-[:FOR_MEDICATION]->(m)",
      { rows: data.prescriptions }
    );
    await run(
      session,
      "UNWIND $rows AS row MATCH (p:Patient {id: row.patientId}) MATCH (dis:Disease {id: row.targetId}) MERGE (p)-[r:HAS_DISEASE]->(dis) SET r.status = row.status, r.since = row.since",
      { rows: data.diseaseEdges }
    );
    await run(
      session,
      "UNWIND $rows AS row MATCH (p:Patient {id: row.patientId}) MATCH (m:Medication {id: row.targetId}) MERGE (p)-[r:TAKES]->(m) SET r.status = row.status, r.since = row.since",
      { rows: data.medicationEdges }
    );

    console.log("Seed complete.");
  } catch (err) {
    console.error("Seed failed:", err instanceof Error ? err.message : err);
    process.exitCode = 1;
  } finally {
    await session.close();
    await driver.close();
  }
}

main();

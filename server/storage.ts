import { User, Course, Enrollment, LiveSession, Content, InsertUser } from "@shared/schema";
import { users, courses, enrollments, liveSessions, content } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getCourses(): Promise<Course[]>;
  getCourse(id: number): Promise<Course | undefined>;
  createCourse(course: Omit<Course, "id">): Promise<Course>;
  getCourseLiveSessions(courseId: number): Promise<LiveSession[]>;
  getAllLiveSessions(): Promise<LiveSession[]>;

  getEnrollments(userId: number): Promise<Enrollment[]>;
  createEnrollment(enrollment: Omit<Enrollment, "id">): Promise<Enrollment>;
  updateProgress(id: number, progress: number): Promise<Enrollment>;
  updateGrade(id: number, grade: number): Promise<Enrollment>;

  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  readonly sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getCourses(): Promise<Course[]> {
    return await db.select().from(courses);
  }

  async getCourse(id: number): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course;
  }

  async getCourseLiveSessions(courseId: number): Promise<LiveSession[]> {
    return await db
      .select()
      .from(liveSessions)
      .where(eq(liveSessions.courseId, courseId));
  }

  async getAllLiveSessions(): Promise<LiveSession[]> {
    return await db.select().from(liveSessions);
  }

  async createCourse(course: Omit<Course, "id">): Promise<Course> {
    const [newCourse] = await db.insert(courses).values(course).returning();
    return newCourse;
  }

  async getEnrollments(userId: number): Promise<Enrollment[]> {
    return await db
      .select()
      .from(enrollments)
      .where(eq(enrollments.userId, userId));
  }

  async createEnrollment(enrollment: Omit<Enrollment, "id">): Promise<Enrollment> {
    const [newEnrollment] = await db
      .insert(enrollments)
      .values({
        ...enrollment,
        progress: 0,
        grade: null,
      })
      .returning();
    return newEnrollment;
  }

  async updateProgress(id: number, progress: number): Promise<Enrollment> {
    const [updated] = await db
      .update(enrollments)
      .set({ progress })
      .where(eq(enrollments.id, id))
      .returning();
    if (!updated) throw new Error("Enrollment not found");
    return updated;
  }

  async updateGrade(id: number, grade: number): Promise<Enrollment> {
    const [updated] = await db
      .update(enrollments)
      .set({ grade })
      .where(eq(enrollments.id, id))
      .returning();
    if (!updated) throw new Error("Enrollment not found");
    return updated;
  }
}

export const storage = new DatabaseStorage();
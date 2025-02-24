import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Courses API
  app.get("/api/courses", async (req, res) => {
    const courses = await storage.getCourses();
    res.json(courses);
  });

  app.get("/api/courses/:id", async (req, res) => {
    const course = await storage.getCourse(parseInt(req.params.id));
    if (!course) return res.status(404).send("Course not found");
    res.json(course);
  });

  app.get("/api/courses/:id/live-sessions", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    const liveSessions = await storage.getCourseLiveSessions(parseInt(req.params.id));
    res.json(liveSessions);
  });

  // All Live Sessions
  app.get("/api/live-sessions", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    const liveSessions = await storage.getAllLiveSessions();
    res.json(liveSessions);
  });

  app.post("/api/courses", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "instructor") {
      return res.status(403).send("Only instructors can create courses");
    }
    const course = await storage.createCourse({
      ...req.body,
      instructorId: req.user.id,
    });
    res.status(201).json(course);
  });

  // Enrollments API
  app.get("/api/enrollments", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    const enrollments = await storage.getEnrollments(req.user.id);
    res.json(enrollments);
  });

  app.post("/api/enrollments", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "student") {
      return res.status(403).send("Only students can enroll in courses");
    }
    const enrollment = await storage.createEnrollment({
      userId: req.user.id,
      courseId: req.body.courseId,
      progress: 0,
      grade: null,
    });
    res.status(201).json(enrollment);
  });

  app.patch("/api/enrollments/:id/progress", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    const enrollment = await storage.updateProgress(
      parseInt(req.params.id),
      req.body.progress,
    );
    res.json(enrollment);
  });

  app.patch("/api/enrollments/:id/grade", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "instructor") {
      return res.status(403).send("Only instructors can update grades");
    }
    const enrollment = await storage.updateGrade(
      parseInt(req.params.id),
      req.body.grade,
    );
    res.json(enrollment);
  });

  const httpServer = createServer(app);
  return httpServer;
}
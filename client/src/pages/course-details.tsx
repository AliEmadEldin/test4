import { useQuery, useMutation } from "@tanstack/react-query";
import { Course, Enrollment, LiveSession } from "@shared/schema";
import { useParams } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Loader2, Calendar, Users, BookOpen, GraduationCap } from "lucide-react";
import { format } from "date-fns";

export default function CourseDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const [newGrade, setNewGrade] = useState("");

  const { data: course } = useQuery<Course>({
    queryKey: [`/api/courses/${id}`],
  });

  const { data: enrollments } = useQuery<Enrollment[]>({
    queryKey: ["/api/enrollments"],
  });

  const { data: liveSessions } = useQuery<LiveSession[]>({
    queryKey: [`/api/courses/${id}/live-sessions`],
  });

  const enrollMutation = useMutation({
    mutationFn: async (courseId: number) => {
      await apiRequest("POST", "/api/enrollments", { courseId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/enrollments"] });
    },
  });

  const updateProgressMutation = useMutation({
    mutationFn: async ({
      enrollmentId,
      progress,
    }: {
      enrollmentId: number;
      progress: number;
    }) => {
      await apiRequest("PATCH", `/api/enrollments/${enrollmentId}/progress`, {
        progress,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/enrollments"] });
    },
  });

  const updateGradeMutation = useMutation({
    mutationFn: async ({
      enrollmentId,
      grade,
    }: {
      enrollmentId: number;
      grade: number;
    }) => {
      await apiRequest("PATCH", `/api/enrollments/${enrollmentId}/grade`, {
        grade,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/enrollments"] });
      setNewGrade("");
    },
  });

  if (!course) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const courseEnrollments = enrollments?.filter(
    (enrollment) => enrollment.courseId === parseInt(id),
  );

  const userEnrollment = courseEnrollments?.find(
    (enrollment) => enrollment.userId === user?.id
  );

  return (
    <div className="container mx-auto p-6">
      <div className="space-y-8">
        {/* Course Header */}
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-3xl cosmic-text">{course.title}</CardTitle>
                <CardDescription className="text-lg mt-2">
                  {course.description}
                </CardDescription>
              </div>
              {user?.role === "student" && !userEnrollment && (
                <Button
                  onClick={() => enrollMutation.mutate(parseInt(id))}
                  disabled={enrollMutation.isPending}
                  size="lg"
                  className="star-button"
                >
                  <GraduationCap className="mr-2 h-5 w-5" />
                  Enroll Now
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <span>Instructor ID: {course.instructorId}</span>
              </div>
              <div className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-muted-foreground" />
                <span>Category: {course.category}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg">${Number(course.price)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Live Sessions */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-xl">Live Sessions Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {liveSessions?.length ? (
                liveSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between border-b border-border pb-4"
                  >
                    <div className="flex items-center space-x-4">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p>{format(new Date(session.date), "PPP")}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(session.date), "p")}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => window.open(session.zoomLink, "_blank")}
                    >
                      Join Session
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">No live sessions scheduled yet.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Student Progress */}
        {user?.role === "student" && userEnrollment && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Your Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Progress value={userEnrollment.progress} />
                <p>Progress: {userEnrollment.progress}%</p>
                {userEnrollment.grade && (
                  <p>Current Grade: {userEnrollment.grade}%</p>
                )}
                <Button
                  onClick={() =>
                    updateProgressMutation.mutate({
                      enrollmentId: userEnrollment.id,
                      progress: Math.min(
                        (userEnrollment.progress || 0) + 10,
                        100,
                      ),
                    })
                  }
                  disabled={
                    updateProgressMutation.isPending ||
                    userEnrollment.progress === 100
                  }
                  className="star-button"
                >
                  Mark Progress
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructor View */}
        {user?.role === "instructor" && courseEnrollments && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Student Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {courseEnrollments.map((enrollment) => (
                  <div
                    key={enrollment.id}
                    className="border border-border rounded-lg p-4 space-y-2"
                  >
                    <p className="font-semibold">Student ID: {enrollment.userId}</p>
                    <Progress value={enrollment.progress} />
                    <p>Progress: {enrollment.progress}%</p>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        placeholder="Enter grade (0-100)"
                        value={newGrade}
                        onChange={(e) => setNewGrade(e.target.value)}
                        className="w-40"
                      />
                      <Button
                        onClick={() =>
                          updateGradeMutation.mutate({
                            enrollmentId: enrollment.id,
                            grade: parseInt(newGrade),
                          })
                        }
                        disabled={
                          updateGradeMutation.isPending ||
                          !newGrade ||
                          parseInt(newGrade) < 0 ||
                          parseInt(newGrade) > 100
                        }
                        className="star-button"
                      >
                        Update Grade
                      </Button>
                    </div>
                    {enrollment.grade && (
                      <p>Current Grade: {enrollment.grade}%</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
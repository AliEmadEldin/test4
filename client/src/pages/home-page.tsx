import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Course, Enrollment, LiveSession } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { 
  GraduationCap, 
  RocketIcon, 
  Users, 
  Calendar,
  BookOpen,
  Clock 
} from "lucide-react";
import { format } from "date-fns";

export default function HomePage() {
  const { user } = useAuth();

  const { data: courses } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const { data: enrollments } = useQuery<Enrollment[]>({
    queryKey: ["/api/enrollments"],
  });

  const { data: liveSessions } = useQuery<LiveSession[]>({
    queryKey: ["/api/live-sessions"],
  });

  const userCourses = courses?.filter(course => {
    return enrollments?.some(enrollment => enrollment.courseId === course.id);
  });

  const upcomingLiveSessions = liveSessions?.filter(session => {
    return new Date(session.date) > new Date();
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="container mx-auto p-6">
      <div className="grid gap-6">
        {/* Welcome Section */}
        <section className="text-center py-12">
          <h1 className="text-4xl font-bold mb-4 cosmic-text">
            Welcome to Space Academy, {user?.email}!
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {user?.role === "instructor"
              ? "Inspire the next generation of space explorers by creating and managing your courses."
              : "Continue your journey through the cosmos with our expert-led courses."}
          </p>
        </section>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RocketIcon className="h-5 w-5" />
                {user?.role === "instructor" ? "Your Courses" : "Enrolled Courses"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {user?.role === "instructor" 
                  ? courses?.filter(c => c.instructorId === user.id).length || 0
                  : enrollments?.length || 0}
              </div>
              <p className="text-muted-foreground">
                {user?.role === "instructor"
                  ? "Courses you're teaching"
                  : "Active enrollments"}
              </p>
            </CardContent>
          </Card>

          {user?.role === "student" && (
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Overall Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {enrollments?.reduce((acc, curr) => acc + curr.progress, 0) / (enrollments?.length || 1)}%
                </div>
                <p className="text-muted-foreground">Average completion rate</p>
              </CardContent>
            </Card>
          )}

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {upcomingLiveSessions?.length || 0}
              </div>
              <p className="text-muted-foreground">
                Live sessions scheduled
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Course Progress Section */}
        <section className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Your Learning Journey</h2>
            <Link href="/courses">
              <Button variant="outline" className="star-button">
                Browse More Courses
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userCourses?.map((course) => {
              const enrollment = enrollments?.find(e => e.courseId === course.id);
              return (
                <Card key={course.id} className="glass-card">
                  <CardHeader>
                    <CardTitle>{course.title}</CardTitle>
                    <CardDescription>{course.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Progress value={enrollment?.progress || 0} />
                    <div className="flex justify-between text-sm">
                      <span>{enrollment?.progress || 0}% Complete</span>
                      {enrollment?.grade && (
                        <span className="font-medium">Grade: {enrollment.grade}%</span>
                      )}
                    </div>
                    <Link href={`/courses/${course.id}`}>
                      <Button className="w-full star-button">
                        Continue Learning
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Upcoming Sessions Section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold">Upcoming Live Sessions</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {upcomingLiveSessions?.slice(0, 4).map((session) => {
              const course = courses?.find(c => c.id === session.courseId);
              return (
                <Card key={session.id} className="glass-card">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{format(new Date(session.date), "PPP")}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(session.date), "p")}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => window.open(session.zoomLink, "_blank")}
                        className="star-button"
                      >
                        Join Session
                      </Button>
                    </div>
                    <p className="font-medium">{course?.title}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
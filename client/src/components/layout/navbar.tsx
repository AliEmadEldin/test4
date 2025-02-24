import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { RocketIcon, BookIcon, LogOutIcon } from "lucide-react";

export default function Navbar() {
  const { user, logoutMutation } = useAuth();

  if (!user) return null;

  return (
    <nav className="bg-primary text-primary-foreground shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/">
              <a className="flex items-center space-x-2">
                <RocketIcon className="h-6 w-6" />
                <span className="font-bold text-lg">Space Academy</span>
              </a>
            </Link>
            <Link href="/courses">
              <a className="flex items-center space-x-2">
                <BookIcon className="h-5 w-5" />
                <span>Courses</span>
              </a>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm">
              {user.role === "instructor" ? "Instructor" : "Student"}: {user.username}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => logoutMutation.mutate()}
            >
              <LogOutIcon className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}

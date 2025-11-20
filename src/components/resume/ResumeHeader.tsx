import { ResumeData } from "@/types/resume";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Globe, Mail, MapPin, Phone } from "lucide-react";

export function ResumeHeader({ basics }: { basics: ResumeData["basics"] }) {
  return (
    <div className="flex flex-col-reverse items-center justify-between gap-8 md:flex-row md:items-start mb-8">
      <div className="flex flex-col items-center md:items-start space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">{basics.name}</h1>
        <p className="text-xl text-muted-foreground">{basics.headline}</p>

        <div className="flex flex-wrap justify-center md:justify-start gap-x-4 gap-y-2 text-sm text-muted-foreground mt-2">
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3" /> {basics.location}
          </div>
          {basics.email && (
            <a
              href={`mailto:${basics.email}`}
              className="flex items-center gap-1 hover:text-foreground"
            >
              <Mail className="h-3 w-3" /> {basics.email}
            </a>
          )}
          {basics.phone && (
            <div className="flex items-center gap-1">
              <Phone className="h-3 w-3" /> {basics.phone}
            </div>
          )}
          {basics.url.href && (
            <a
              href={basics.url.href}
              target="_blank"
              className="flex items-center gap-1 hover:text-foreground"
            >
              <Globe className="h-3 w-3" /> Portfolio
            </a>
          )}
        </div>
      </div>

      <Avatar className="h-32 w-32 border-2 border-muted">
        <AvatarImage src={basics.picture.url} className="object-cover" />
        <AvatarFallback>{basics.name[0]}</AvatarFallback>
      </Avatar>
    </div>
  );
}

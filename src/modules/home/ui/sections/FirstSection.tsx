import {
  BadgeIcon,
  BaggageClaimIcon,
  PodcastIcon,
  StarIcon,
  TextQuoteIcon,
  UserIcon,
  VoteIcon,
} from "lucide-react";

const cardData = [
  {
    icon: <UserIcon className="font-bold text-2xl" />,
    title: "Create an account",
    description:
      "Start your journey by creating a free account and join a vibrant community of nature enthusiasts from around the world.",
  },
  {
    icon: <PodcastIcon className="font-bold text-2xl" />,
    title: "Create posts",
    description:
      "Share your adventures and discoveries by creating posts with photos, stories, and tips for fellow explorers to enjoy.",
  },
  {
    icon: <BaggageClaimIcon className="font-bold text-2xl" />,
    title: "Create events",
    description:
      "Organize and promote nature events, hikes, or meetups, and invite others to join you in exploring the wild together.",
  },
  {
    icon: <TextQuoteIcon className="font-bold text-2xl" />,
    title: "Comment",
    description:
      "Engage with the community by commenting on posts, sharing your thoughts, asking questions, and offering encouragement.",
  },
  {
    icon: <VoteIcon className="font-bold text-2xl" />,
    title: "Participate in votations",
    description:
      "Take part in community votations to help decide on featured content, event locations, or the next big adventure.",
  },
  {
    icon: <BadgeIcon className="font-bold text-2xl" />,
    title: "Earn badges",
    description:
      "Collect unique badges as you participate, contribute, and reach new milestones on your journey with Wild Wonders.",
  },
];

export function FirstSection() {
  return (
    <div className="relative h-auto flex flex-col justify-start items-center py-20">
      <div className="w-full h-auto flex flex-col items-center justify-center gap-4">
        <div
          className={`text-sm font-medium px-3 py-1 w-auto flex items-center gap-2 rounded-full bg-white border border-grey-400`}
        >
          <StarIcon size={16} className="text-red" />
          <p>What We Do</p>
        </div>
        <div className="w-auto h-auto flex flex-col items-center justify-center gap-2 px-8">
          <h3 className="text-5xl font-bold leading-[1] text-center">
            Join the Wild Wonders Community
          </h3>
          <p className="text-center">
            Join the Wild Wonders Community and explore the wonders of nature.
            Upload posts, comment on others, and get involved in the community.
          </p>
        </div>
        <div className="w-full max-w-[1600px] h-auto py-12 px-8 flex flex-wrap justify-center items-center gap-4">
          {cardData.map((card, idx) => (
            <div
              key={idx}
              className="flex-1 min-h-[200px] w-auto min-w-1/2 md:min-w-[380px] max-w-[400px] border border-[#E5E5E5] rounded-sm bg-[#FCFCFC] py-6 px-8 flex flex-col items-center justify-center gap-4"
            >
              <div className="w-full flex items-center justify-start gap-2">
                <span className="text-red">{card.icon}</span>
                <p className="text-lg font-semibold">{card.title}</p>
              </div>
              <div className="w-full flex items-center justify-start gap-2">
                <p>{card.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

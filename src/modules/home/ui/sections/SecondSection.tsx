/* eslint-disable @next/next/no-img-element */
import { StarIcon } from "lucide-react";

const postData = [
  {
    image: "/oso.jpg",
    title: "Viaje a la Llanuras Altiplánicas",
    description:
      "Lorem, ipsum dolor sit amet consectetur adipisicing elit. Adipisci illo laboriosam aspernatur voluptatem, ipsam tenetur quae incidunt enim harum consectetur.",
    authorName: "John Doe",
    authorInitials: "JD",
    tags: ["América", "Argentina", "Llanuras"],
    badgeColor: "bg-blue-500",
  },
  {
    image: "/zorro.jpg",
    title: "Aventura en el Bosque Encantado",
    description:
      "Explora los misterios del bosque y descubre criaturas únicas en un entorno mágico y natural.",
    authorName: "Alice Smith",
    authorInitials: "AS",
    tags: ["Europa", "Bosque", "Encantado"],
    badgeColor: "bg-green-500",
  },
  {
    image: "/aurora.jpg",
    title: "Auroras Boreales en el Norte",
    description:
      "Una experiencia inolvidable bajo las luces del norte, rodeado de paisajes nevados y cielos estrellados.",
    authorName: "Carlos Ruiz",
    authorInitials: "CR",
    tags: ["Norte", "Auroras", "Aventura"],
    badgeColor: "bg-purple-500",
  },
];

export function SecondSection() {
  return (
    <div className="relative h-auto flex flex-col justify-start items-center py-20">
      <div className="w-full h-auto flex flex-col items-center justify-center gap-4">
        <div
          className={`text-sm font-medium px-3 py-1 w-auto flex items-center gap-2 rounded-full bg-white border border-grey-400`}
        >
          <StarIcon size={16} className="text-red" />
          <p>Some of our posts</p>
        </div>
        <div className="w-auto h-auto flex flex-col items-center justify-center gap-2 px-8">
          <h3 className="text-5xl font-bold leading-[1] text-center px-8 md:px-52">
            Here are some of the posts from members of our community
          </h3>
          <p className="text-center">
            Join the Wild Wonders Community and explore the wonders of nature.
            Upload posts, comment on others, and get involved in the community.
          </p>
        </div>
        <div className="w-full max-w-[1600px] h-auto py-12 px-8 flex flex-col justify-center items-center gap-4">
          {postData.map((post, idx) => (
            <div
              key={idx}
              className="w-full min-w-1/2 max-w-[1100px] h-auto md:h-[400px] border border-[#E5E5E5] rounded-sm bg-white py-6 px-6 flex md:flex-row flex-col items-center justify-center gap-4"
            >
              <div className="w-full md:w-[60%] h-full flex items-center justify-center">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover object-center rounded-sm"
                />
              </div>
              <div className="w-full md:w-[40%] h-full flex flex-col items-start justify-between px-3 py-3">
                <div className="w-full flex flex-col items-start justify-start gap-2 pb-4">
                  <h3 className="text-2xl font-bold">{post.title}</h3>
                  <p className="text-sm text-grey-400">{post.description}</p>
                  <div className="flex flex-wrap items-center justify-start pt-2 gap-2">
                    {post.tags.map((tag, i) => (
                      <div
                        key={i}
                        className="text-[12px] font-medium px-3 py-1 w-auto flex items-center gap-2 rounded-full bg-[#F7F7F7] border border-grey-400"
                      >
                        <p>{tag}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="w-full px-2 py-3 border-t-1 border-grey-400 flex items-center gap-3">
                  {/* Author badge */}
                  <span className="flex items-center gap-2 text-gray-500">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white shadow-md ${post.badgeColor}`}
                    >
                      {post.authorInitials}
                    </div>
                    <span className="font-bold">{post.authorName}</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

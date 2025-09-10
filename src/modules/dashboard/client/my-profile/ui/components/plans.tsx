type PlansProps = { userId?: number };

export const Plans = ({ userId }: PlansProps) => {
  return <div>Plans for user {userId ?? "—"}</div>;
};

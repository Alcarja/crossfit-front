type PersonalActivityProps = { userId?: number };

export const PersonalActivity = ({ userId }: PersonalActivityProps) => {
  return <div>Personal activity for user {userId ?? "—"}</div>;
};

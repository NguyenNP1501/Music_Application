export default function RoomMembers({
  members = [],
  currentUserId,
  creatorId,
}) {
  const getInitial = (name) => name?.trim()?.charAt(0)?.toUpperCase() || "?";

  return (
    <section className="room-members-card">
      <h3>Thành viên · {members.length}</h3>

      {members.length === 0 ? (
        <p className="room-members-empty">Chưa có thông tin thành viên.</p>
      ) : (
        <div className="room-members-list">
          {members.map((member) => {
            const person = member.user;
            const isCreator = member.Useruser_id === creatorId;
            const isCurrentUser = member.Useruser_id === currentUserId;

            return (
              <div className="room-member" key={member.Useruser_id}>
                <div className="room-member-avatar">
                  {person?.avatar_url ? (
                    <img
                      src={person.avatar_url}
                      alt={person.full_name || "Thành viên"}
                    />
                  ) : (
                    getInitial(person?.full_name)
                  )}
                </div>

                <div className="room-member-info">
                  <strong>
                    {person?.full_name || "Người dùng"}
                    {isCurrentUser ? " (Bạn)" : ""}
                  </strong>

                  <span>
                    <i />
                    {isCreator ? "Chủ phòng" : "Thành viên"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default function RoomMembers({ members }) {
  return (
    <section className="room-members-card">
      <h3>Thành viên · {members.length}</h3>

      <div className="room-members-list">
        {members.map((member) => (
          <div className="room-member" key={member.id}>
            <div className="room-member-avatar">
              {member.name.charAt(0).toUpperCase()}
            </div>

            <div className="room-member-info">
              <strong>{member.name}</strong>
              <span
                className={member.online ? "member-online" : "member-offline"}
              >
                <i />
                {member.role === "Chủ phòng"
                  ? "Chủ phòng"
                  : member.online
                    ? "Trực tuyến"
                    : "Ngoại tuyến"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

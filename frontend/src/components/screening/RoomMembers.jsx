import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "../../services/api";

export default function RoomMembers({
  roomId,
  totalMembers = 0,
  currentUserId,
  creatorId,
}) {
  const [members, setMembers] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(totalMembers);
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadMembers = useCallback(
    async (nextPage = 1, keyword = search, limit = 20) => {
      if (!roomId) return;

      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams({
          page: String(nextPage),
          limit: String(limit),
          search: keyword,
        });

        const data = await apiRequest(
          `/rooms/${roomId}/members?${params.toString()}`,
        );

        setMembers(data.members || []);
        setPage(data.pagination?.page || 1);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotal(data.pagination?.total ?? totalMembers);
      } catch (err) {
        setError(err.message || "Không thể tải danh sách thành viên.");
        setMembers([]);
      } finally {
        setLoading(false);
      }
    },
    [roomId, search, totalMembers],
  );

  useEffect(() => {
    setSearch("");
    setShowAll(false);
    loadMembers(1, "", 5);
  }, [roomId]);

  useEffect(() => {
    setTotal(totalMembers);
  }, [totalMembers]);

  const handleSearch = (event) => {
    const value = event.target.value;
    setSearch(value);
    loadMembers(1, value, 20);
  };

  const displayMembers = showAll ? members : members.slice(0, 5);

  return (
    <section className="room-members-card">
      <div className="room-members-heading">
        <h3>Thành viên</h3>
        <span>{total.toLocaleString("vi-VN")} người</span>
      </div>

      {error && (
        <p className="room-members-error" role="alert">
          {error}
        </p>
      )}

      {loading && members.length === 0 ? (
        <p className="room-members-empty">Đang tải thành viên...</p>
      ) : (
        <>
          <div className="room-members-list">
            {displayMembers.map((member) => {
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
                      person?.full_name?.trim()?.charAt(0)?.toUpperCase() || "?"
                    )}
                  </div>

                  <div className="room-member-info">
                    <strong>
                      {person?.full_name || "Người dùng"}
                      {isCurrentUser ? " (Bạn)" : ""}
                    </strong>

                    <span>{isCreator ? "Chủ phòng" : "Thành viên"}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {!showAll && total > 5 && (
            <button
              type="button"
              className="room-members-view-all"
              onClick={() => {
                setShowAll(true);
                loadMembers(1, "", 20);
              }}
            >
              Xem tất cả {total.toLocaleString("vi-VN")} thành viên
            </button>
          )}

          {showAll && (
            <div className="room-members-expanded">
              <input
                type="search"
                value={search}
                onChange={handleSearch}
                placeholder="Tìm thành viên..."
                aria-label="Tìm thành viên"
              />

              {loading && <p className="room-members-empty">Đang tải...</p>}

              {!loading && members.length === 0 && (
                <p className="room-members-empty">Không tìm thấy thành viên.</p>
              )}

              <div className="room-members-pagination">
                <span>
                  Trang {page}/{Math.max(1, totalPages)}
                </span>

                <div>
                  <button
                    type="button"
                    disabled={page <= 1 || loading}
                    onClick={() => loadMembers(page - 1)}
                  >
                    Trước
                  </button>

                  <button
                    type="button"
                    disabled={page >= totalPages || loading}
                    onClick={() => loadMembers(page + 1)}
                  >
                    Tiếp
                  </button>
                </div>
              </div>

              <button
                type="button"
                className="room-members-collapse"
                onClick={() => {
                  setShowAll(false);
                  setSearch("");
                  loadMembers(1, "", 5);
                }}
              >
                Thu gọn
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

// Ambient background system ported from campus_app_redesign_v7.html:
// four drifting, heavily-blurred colour blobs + a full-screen grain
// overlay. Rendered once per shell (AppLayout / auth screens), fixed so
// it sits behind content on every scroll position.
export default function AmbientBackground() {
  return (
    <>
      <div className="ambient-layer -z-10" aria-hidden="true">
        <div className="ambient-blob b1" />
        <div className="ambient-blob b2" />
        <div className="ambient-blob b3" />
        <div className="ambient-blob b4" />
      </div>
      <div className="grain" aria-hidden="true" />
    </>
  );
}

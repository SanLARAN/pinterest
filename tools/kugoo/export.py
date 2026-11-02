import bpy, bmesh, json, math, sys
from mathutils import Matrix, Vector

OUT = sys.argv[sys.argv.index('--') + 1]
dg = bpy.context.evaluated_depsgraph_get()
sc = bpy.context.scene

DROP = ('Bolts', 'Nipples', 'Rivets', 'Steering_Nut', 'Axle_Spacers', 'Shafts', 'Motor_Shaft', 'Shock_Mount_Bolt', 'Fork_Hardware', 'Studio')
# target triangles per object (after decimation); anything not named gets RATIO_DEFAULT of its own count, capped
TARGET = {
    'Frame_Plate_L': 420, 'Frame_Plate_R': 420, 'Seat': 700, 'Battery_Pack': 200, 'Chain': 260, 'Shock_Spring': 160,
    'Number_Plate': 380, 'Front_Fender': 420, 'Handlebar': 260, 'Grips': 120, 'Bar_Controls': 120, 'Front_Sprocket': 80,
    'Wheel_Front_Tyre': 900, 'Wheel_Rear_Tyre': 900, 'Wheel_Front_Rim': 260, 'Wheel_Rear_Rim': 260,
    'Wheel_Front_Disc': 220, 'Wheel_Rear_Disc': 220, 'Wheel_Front_Disc_Carrier': 140, 'Wheel_Rear_Disc_Carrier': 140,
    'Wheel_Rear_Sprocket': 160, 'Rear_Caliper': 120, 'Front_Caliper': 120, 'Cable_Switch': 60, 'Cable_Throttle': 60,
    'Cable_Dash': 40, 'Brake_Hose_Front': 60, 'Swingarm_Arm_L': 220, 'Swingarm_Arm_R': 220, 'Swingarm_Brace': 140,
    'Motor': 200, 'Motor_Housing': 160, 'Top_Clamp': 140, 'Lower_Clamp': 140, 'Bar_Risers': 120, 'Fork_Sliders': 200,
    'Footpegs': 120, 'Footpeg_Brackets': 120, 'Wheel_Front_Spokes': 720, 'Wheel_Rear_Spokes': 720,
    'Wheel_Front_Hub': 160, 'Wheel_Rear_Hub': 160,
}
CAP = 300

def group_of(ob):
    n = ob.name
    if n.startswith('Wheel_Front'): return 'wheelF'
    if n.startswith('Wheel_Rear'): return 'wheelR'
    if n in ('Fork_Sliders', 'Front_Caliper', 'Front_Caliper_Bracket'): return 'forkLow'
    p = ob.parent
    while p:
        if p.name == 'Steering': return 'steer'
        if p.name == 'Swingarm': return 'swing'
        p = p.parent
    return 'body'

PIVOT = {'body': 'Kugoo_Wish01', 'steer': 'Steering', 'forkLow': 'Steering', 'swing': 'Swingarm', 'wheelF': 'Wheel_Front', 'wheelR': 'Wheel_Rear'}

# Blender (+X forward, +Y left, +Z up) -> the bike's frame in the game (+X right, +Y up, -Z forward)
CONV = Matrix(((0, -1, 0, 0), (0, 0, 1, 0), (-1, 0, 0, 0), (0, 0, 0, 1)))
root = bpy.data.objects['Kugoo_Wish01']
fa = bpy.data.objects['Wheel_Front'].matrix_world.translation
ra = bpy.data.objects['Wheel_Rear'].matrix_world.translation
mid = (fa + ra) / 2
CENTER = Matrix.Translation(Vector((-mid.x, -mid.y, 0)))  # the origin between the axles, on the ground

def to_game(M):
    return CONV @ CENTER @ M

out = {'groups': {}, 'pivots': {}}
for g, pn in PIVOT.items():
    P = to_game(bpy.data.objects[pn].matrix_world)
    out['pivots'][g] = [list(r) for r in P]

MATS = {}
for ob in sc.objects:
    if ob.type not in ('MESH', 'CURVE') or ob.hide_render: continue
    if any(k in ob.name for k in DROP): continue
    if ob.name.startswith('Studio'): continue
    g = group_of(ob)
    piv = to_game(bpy.data.objects[PIVOT[g]].matrix_world)
    inv = piv.inverted()
    e = ob.evaluated_get(dg)
    me = e.to_mesh()
    bm = bmesh.new()
    bm.from_mesh(me)
    bmesh.ops.triangulate(bm, faces=bm.faces[:])
    n0 = len(bm.faces)
    tgt = TARGET.get(ob.name, min(CAP, n0))
    if n0 > tgt * 1.15:
        tmp = bpy.data.meshes.new('tmp')
        bm.to_mesh(tmp)
        bm.free()
        o2 = bpy.data.objects.new('tmp', tmp)
        sc.collection.objects.link(o2)
        mod = o2.modifiers.new('d', 'DECIMATE')
        mod.ratio = max(0.004, tgt / n0)
        mod.use_collapse_triangulate = True
        dg2 = bpy.context.evaluated_depsgraph_get()
        me2 = o2.evaluated_get(dg2).to_mesh()
        bm = bmesh.new()
        bm.from_mesh(me2)
        bmesh.ops.triangulate(bm, faces=bm.faces[:])
        o2.evaluated_get(dg2).to_mesh_clear()
        bpy.data.objects.remove(o2)
        bpy.data.meshes.remove(tmp)
    M = inv @ to_game(ob.matrix_world)
    bm.normal_update()
    mats = [s.material.name if s.material else 'none' for s in ob.material_slots] or ['none']
    tris = out['groups'].setdefault(g, [])
    for f in bm.faces:
        vs = [M @ l.vert.co for l in f.loops]
        # an edge is drawn only where the surface folds, ends, or changes material
        hide = 0
        for k, l in enumerate(f.loops):
            ed = l.edge
            vis = ed.is_boundary or len(ed.link_faces) != 2
            if not vis:
                f2 = ed.link_faces[0] if ed.link_faces[1] == f else ed.link_faces[1]
                vis = f.normal.angle(f2.normal, 0) > math.radians(32) or f2.material_index != f.material_index
            if not vis:
                hide |= (1, 2, 4)[k]  # edge k runs from loop k to loop k+1: a-b, b-c, c-a
        mn = mats[min(f.material_index, len(mats) - 1)]
        MATS[mn] = MATS.get(mn, 0) + 1
        tris.append([round(c, 4) for v in vs for c in v] + [mn, hide])
    bm.free()
    e.to_mesh_clear()

out['mats'] = MATS
out['count'] = {g: len(v) for g, v in out['groups'].items()}
json.dump(out, open(OUT, 'w'))
print('EXPORTED', out['count'], sum(out['count'].values()))

import sys
import warnings
import datetime
import numpy as np
import json
from collections import OrderedDict
import pcl

#warnings.simplefilter('ignore')
#print(pcl.__file__)


#empty = sys.stdin.readline()

f = open('./src/pcl_json.json', 'r')
# print("f is", f)
json_dict = json.load(f)

dat1 = json_dict['npy_name'][0]
if dat1[-3:] == "npy":
    original_pc = np.load(dat1)

    pos = original_pc[:, :, 0:3]
    pos_zmin = sorted(pos[:, :, 2].ravel())[4000]

    # print("pos_zmin is ", pos_zmin)
    pos_without_ground = pos[pos[:, :, 2] > pos_zmin + 0.3]
    # print("pos_out_ground is ", pos_without_ground.shape)
    pos_2dim = pos_without_ground.reshape([-1, 3])

if dat1[-3:] == "txt":
    original_pc = np.loadtxt(dat1)
    #print("original_pc is ", original_pc)

    #print("pos.shape is ", original_pc.shape)
    pos = original_pc[:, 0:3].astype(np.float32)
    pos_zmin = sorted(pos[:, 2].ravel())[4000]

    #print("pos_zmin is ", pos_zmin)
    pos_without_ground = pos[pos[:, 2] > pos_zmin + 0.7]
    # print("pos_out_ground is ", pos_without_ground.shape)
    pos_2dim = pos_without_ground.reshape([-1, 3])

# pointcloud のクラスタリング
pointcloud = pcl.PointCloud(pos_2dim)
#print(pointcloud)
vg = pointcloud.make_voxel_grid_filter()
vg.set_leaf_size(0.01, 0.01, 0.01)
cloud_filtered = vg.filter()

seg = pointcloud.make_segmenter()
seg.set_optimize_coefficients(True)
seg.set_model_type(pcl.SACMODEL_PLANE)
seg.set_method_type(pcl.SAC_RANSAC)
seg.set_MaxIterations(100)
seg.set_distance_threshold(0.02)

i = 0
nr_points = cloud_filtered.size

tree = cloud_filtered.make_kdtree()

ec = cloud_filtered.make_EuclideanClusterExtraction()
ec.set_ClusterTolerance(0.25)
ec.set_MinClusterSize(50)
ec.set_MaxClusterSize(50000)
ec.set_SearchMethod(tree)
cluster_indices = ec.Extract()
#print(ec)

cloud_cluster = pcl.PointCloud()

points_list = []
points_maxmin = []
for j, indices in enumerate(cluster_indices):
    #print('indices = ' + str(len(indices)))
    points = np.zeros((len(indices), 3), dtype=np.float32)

    for i, indice in enumerate(indices):
        points[i][0] = cloud_filtered[indice][0]
        points[i][1] = cloud_filtered[indice][1]
        points[i][2] = cloud_filtered[indice][2]

    #print("points is ", points.shape)
    points_list.append(points.tolist())
    x_max, x_min = np.max(points[:, 0]), np.min(points[:, 0])
    y_max, y_min = np.max(points[:, 1]), np.min(points[:, 1])
    z_max, z_min = np.max(points[:, 2]), np.min(points[:, 2])
    points_maxmin.append([[float(x_max), float(x_min)], [float(y_max), float(y_min)], [float(z_max), float(z_min)]])
    #print("pointsmax is ", [[x_max, x_min], [y_max, y_min], [z_max, z_min]])
# 辞書を作成
original_pc = original_pc.tolist()
pos = pos.tolist()
points_list = points_list
#print("points_list shape is", len(points_list))

pc_dict = {}
pc_dict["all_data"] = original_pc
pc_dict["only_xyz"] = pos
pc_dict["clustaring_data"] = points_list
pc_dict["clust_maxmin"] = points_maxmin
#print(type(original_pc))
#print(pc_dict)
#print(points_maxmin)
with open('./src/clustaring_data.json', 'w', encoding='utf-8') as f:
    json.dump(pc_dict, f, indent=4)

#print(pc_dict)

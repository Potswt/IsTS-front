import { Skeleton, List } from "antd";

const ListSkeleton = () => {
  const skeletonItems = Array.from({ length: 5 }).map((_, index) => (
    <List.Item key={index}>
      <List.Item.Meta
        avatar={<Skeleton.Avatar active />}
        title={<Skeleton.Input style={{ width: 200 }} active />}
        description={<Skeleton.Input style={{ width: 400 }} active />}
      />
      <Skeleton.Button active />
    </List.Item>
  ));

  return <List>{skeletonItems}</List>;
};

export default ListSkeleton;

export type ProductInput = {
  name: string;
  price: number;
  soluong: number;
  image?: string;
};
export type Product = Omit<ProductInput, "image"> & {
  id: string;
  image: string;
};

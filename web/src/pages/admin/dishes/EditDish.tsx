import { useForm } from "react-hook-form";

export default function EditDish(){

  const {register,handleSubmit} = useForm()

  const onSubmit = (data:any)=>{
    console.log("updated",data)
  }

  return(

    <div className="max-w-xl mx-auto p-6 bg-white shadow rounded">

      <h1 className="text-xl font-bold mb-4">
        Edit Dish
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        <input
          {...register("category")}
          placeholder="Category"
          className="border p-2 w-full rounded"
        />

        <input
          {...register("name")}
          placeholder="Dish name"
          className="border p-2 w-full rounded"
        />

        <button
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Update Dish
        </button>

      </form>

    </div>
  )
}
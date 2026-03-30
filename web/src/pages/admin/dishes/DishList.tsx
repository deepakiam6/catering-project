import { useNavigate } from "react-router-dom";

const dishes = [
  {
    id:1,
    category:"Starter",
    items:["Soup","Pani Puri","Bajji"]
  },
  {
    id:2,
    category:"Main Dish",
    items:["Mini Idli","Veg Briyani","Sambar"]
  }
];

export default function DishList(){

  const navigate = useNavigate()

  return(

    <div className="p-6 grid grid-cols-3 gap-6">

      {dishes.map((dish)=>(
        <div key={dish.id} className="border rounded p-4 shadow">

          <h2 className="font-bold text-lg mb-2">
            {dish.category}
          </h2>

          <ul className="list-disc ml-5">
            {dish.items.map((item,i)=>(
              <li key={i}>{item}</li>
            ))}
          </ul>

          <div className="flex gap-2 mt-4">

            <button
              onClick={()=>navigate(`/admin/dishes/edit/${dish.id}`)}
              className="bg-yellow-500 text-white px-3 py-1 rounded"
            >
              Edit
            </button>

            <button
              className="bg-red-500 text-white px-3 py-1 rounded"
            >
              Delete
            </button>

          </div>

        </div>
      ))}

    </div>
  )
}
module PointGroups
  class Update < Mutations::Command
    required do
      model :device, class: Device
    end

    def execute
      raise "Not yet implemented"
    end
  end
end
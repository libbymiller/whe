require 'thin'
require 'sinatra'
require 'sinatra/base'
require 'sinatra/cross_origin'
require 'json'
require 'pp'
require 'time'

$stdout.sync = true

Rack::Utils.multipart_part_limit = 0

class MyApp < Sinatra::Base
  register Sinatra::CrossOrigin

  set :static, true
  set :public_dir, 'public'

  get '/exclusions' do
    cross_origin
    puts "exclusions"  
    exclusions = File.read("exclusions.txt")
    exclusions
  end

# these go initially in a different place, periodically deleted

  post '/image' do
   begin
    cross_origin
    puts "=====got image====="
    pp params
    name =  params[:name]

    unless params[:name] &&
           (tmpfile = params[:name][:tempfile]) 
      @error = "No file selected"
    end
    filename =  params[:name][:filename]
    STDERR.puts "Saving file, original name #{filename}"
    directory = "public"
    path = File.join(directory, filename)
    File.open(path, 'wb') do |f|
      while chunk = tmpfile.read(65536)
        f.write(chunk)
      end
      tmpfile.close
    end
    puts "done"

    rescue Exception => e
      puts "PROBLEM with image"
      puts "\n\n\n"
      puts e
    end

    "Upload complete\n"
  end

end



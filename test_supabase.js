const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://isgnbnulxchbfsydumve.supabase.co',
    'sb_publishable_Dot9UtXiDOKQFfo02gEDNA_ohkiZbaW'
);

async function checkPosts() {
    const { data, error } = await supabase.from('posts').select('*').limit(1);
    if (error) {
        console.error("Error fetching posts:", error);
    } else {
        console.log("Posts table columns:");
        if (data.length > 0) {
            console.log(Object.keys(data[0]));
            // Also try inserting something dummy
        }
        console.log("Table is empty, trying to insert a dummy to see the error...");
        const dummy = { title: "Test", category: "News", content: "Test", published_at: new Date().toISOString() };
        const { error: insertError } = await supabase.from('posts').insert([dummy]);
        console.log("Insert error details:", insertError);
    }
}

checkPosts();
